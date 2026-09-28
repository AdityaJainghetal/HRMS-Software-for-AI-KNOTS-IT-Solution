const DAY_MS = 24 * 60 * 60 * 1000;

const dateOnly = (value) => {
  const date = new Date(value);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
};

const monthDate = (year, month, day) => {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
};

export const getFinancialYearStart = (value) => {
  const date = dateOnly(value);
  const year = date.getUTCFullYear() - (date.getUTCMonth() < 3 ? 1 : 0);
  return new Date(Date.UTC(year, 3, 1));
};

const getCalendarMonthRange = (value) => {
  const date = dateOnly(value);
  return {
    start: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)),
    end: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)),
  };
};

export const getJoiningMonthPeriod = (value, joinDateValue) => {
  const date = dateOnly(value);
  const joinDate = dateOnly(joinDateValue);
  const joiningDay = joinDate.getUTCDate();
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth();
  let periodStart = monthDate(year, month, joiningDay);

  if (date < periodStart) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
    periodStart = monthDate(year, month, joiningDay);
  }

  let nextMonth = periodStart.getUTCMonth() + 1;
  let nextYear = periodStart.getUTCFullYear();
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear += 1;
  }
  const periodEnd = new Date(
    monthDate(nextYear, nextMonth, joiningDay).getTime() - DAY_MS,
  );
  return { periodStart, periodEnd };
};

const getLeaveCategory = (leave) => {
  const type = leave.type === "half_day" ? leave.originalType : leave.type;
  if (["vacation", "casual", "earned", "study"].includes(type)) {
    return "monthly";
  }
  return type === "personal" ? "plain" : type;
};

const getLeaveDays = (leave, start, end) => {
  const leaveStart = dateOnly(leave.startDate);
  const leaveEnd = dateOnly(leave.endDate);
  const overlapStart = leaveStart > start ? leaveStart : start;
  const overlapEnd = leaveEnd < end ? leaveEnd : end;
  if (overlapEnd < overlapStart) return 0;
  if (leave.type === "half_day") return Number(leave.days) || 0.5;
  return Math.floor((overlapEnd - overlapStart) / DAY_MS) + 1;
};

const isCountedLeave = (leave) =>
  ["pending", "approved"].includes(leave.status);

const getMonthlyAccruedLeaves = (employee, throughDate, financialYearStart) => {
  const joinDate = dateOnly(employee.startDate);
  const through = dateOnly(throughDate);
  if (through < joinDate) return 0;

  let accruedLeaves = 0;
  for (let index = 0; index < 2400; index += 1) {
    const monthIndex = joinDate.getUTCMonth() + index;
    const year = joinDate.getUTCFullYear() + Math.floor(monthIndex / 12);
    const month = monthIndex % 12;
    const accrualDate = monthDate(year, month, joinDate.getUTCDate());
    if (accrualDate > through) break;
    if (accrualDate >= financialYearStart) {
      accruedLeaves += index === 0 && joinDate.getUTCDate() > 15 ? 1 : 2;
    }
  }
  return accruedLeaves;
};

export const getLeaveBalanceSummary = (
  employee,
  leaves,
  referenceDate = new Date(),
) => {
  const joinDate = dateOnly(employee.startDate);
  const reference = dateOnly(referenceDate);
  const financialYearStart = getFinancialYearStart(reference);
  const period = getCalendarMonthRange(reference);
  const currentMonthLeaves = leaves.filter((leave) => {
    if (!isCountedLeave(leave)) return false;
    return getLeaveDays(leave, period.start, period.end) > 0;
  });
  const usedInFinancialYear = leaves.reduce((sum, leave) => {
    if (!isCountedLeave(leave) || getLeaveCategory(leave) !== "monthly")
      return sum;
    return sum + getLeaveDays(leave, financialYearStart, reference);
  }, 0);
  const accruedMonthlyLeaves = getMonthlyAccruedLeaves(
    employee,
    reference,
    financialYearStart,
  );
  const halfDayRequests = leaves.filter((leave) => leave.type === "half_day");
  const usedForCategory = (category) =>
    currentMonthLeaves.reduce(
      (sum, leave) =>
        getLeaveCategory(leave) === category
          ? sum + getLeaveDays(leave, period.start, period.end)
          : sum,
      0,
    );

  return {
    financialYear: `${financialYearStart.getUTCFullYear()}-${financialYearStart.getUTCFullYear() + 1}`,
    monthly: {
      accrued: accruedMonthlyLeaves,
      used: usedInFinancialYear,
      available: Math.max(accruedMonthlyLeaves - usedInFinancialYear, 0),
      carryForward: Math.max(accruedMonthlyLeaves - usedInFinancialYear - 2, 0),
    },
    halfDays: {
      taken: halfDayRequests.filter((leave) => leave.status === "approved")
        .length,
      pending: halfDayRequests.filter((leave) => leave.status === "pending")
        .length,
    },
    sick: {
      allowance: 1,
      used: usedForCategory("sick"),
      available: Math.max(1 - usedForCategory("sick"), 0),
    },
    plain: {
      allowance: 1,
      used: usedForCategory("plain"),
      available: Math.max(1 - usedForCategory("plain"), 0),
    },
    menstrual: {
      allowance:
        employee.gender === "F" || employee.gender === "female" ? 1 : 0,
      used: usedForCategory("menstrual"),
      available:
        employee.gender === "F" || employee.gender === "female"
          ? Math.max(1 - usedForCategory("menstrual"), 0)
          : 0,
    },
  };
};

export const validateLeaveEligibility = (
  employee,
  leaves,
  request,
  referenceDate = new Date(),
) => {
  const startDate = dateOnly(request.startDate);
  const endDate = dateOnly(request.endDate);
  const joinDate = dateOnly(employee.startDate);
  const days = Number(request.days);
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate < startDate
  ) {
    return "Please provide a valid leave date range.";
  }
  if (startDate < joinDate)
    return "Leave cannot start before the joining date.";

  const requestedType =
    request.type === "half_day" ? request.originalType : request.type;
  const type =
    requestedType === "personal"
      ? "plain"
      : ["vacation", "casual", "earned", "study"].includes(requestedType)
        ? "monthly"
        : requestedType;
  const period = getCalendarMonthRange(startDate);
  if (["sick", "plain", "menstrual"].includes(type)) {
    if (type === "plain") {
      const daysNotice = Math.floor(
        (startDate - dateOnly(referenceDate)) / DAY_MS,
      );
      if (daysNotice < 3) {
        return "Plain Leave must be requested at least 3 calendar days in advance.";
      }
    }
    if (endDate > period.end || days > 1) {
      return `${type === "sick" ? "Sick" : type === "plain" ? "Plain" : "Menstrual"} Leave is limited to 1 day within the calendar month.`;
    }
    if (
      type === "menstrual" &&
      employee.gender !== "F" &&
      employee.gender !== "female"
    ) {
      return "Menstrual Leave is available only to female employees.";
    }
    const used = leaves.reduce((sum, leave) => {
      if (!isCountedLeave(leave) || getLeaveCategory(leave) !== type)
        return sum;
      return sum + getLeaveDays(leave, period.start, period.end);
    }, 0);
    if (used + days > 1) {
      return `${type === "sick" ? "Sick" : type === "plain" ? "Plain" : "Menstrual"} Leave allowance for this month has been used.`;
    }
    return null;
  }

  if (type === "monthly") {
    const startYear = getFinancialYearStart(startDate);
    if (getFinancialYearStart(endDate).getTime() !== startYear.getTime()) {
      return "Monthly Leave requests cannot cross the financial-year boundary.";
    }
    const existingUsed = leaves.reduce((sum, leave) => {
      if (!isCountedLeave(leave) || getLeaveCategory(leave) !== "monthly")
        return sum;
      return sum + getLeaveDays(leave, startYear, endDate);
    }, 0);
    const accrued = getMonthlyAccruedLeaves(employee, startDate, startYear);
    if (existingUsed + days > accrued) {
      return `Insufficient Monthly Leave balance. ${Math.max(accrued - existingUsed, 0)} day(s) available.`;
    }
  }
  return null;
};
