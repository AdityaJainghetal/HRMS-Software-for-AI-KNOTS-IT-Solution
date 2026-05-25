// import mongoose from 'mongoose';

// const AttendanceSchema = new mongoose.Schema(
//   {
//     employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
//     date: { type: Date, required: true },
//     checkIn: { type: String, default: null }, // e.g., '09:15'
//     checkOut: { type: String, default: null },
//     status: { type: String, enum: ['present', 'absent', 'late', 'leave'], default: 'present' },
//     location: { type: String, default: null }, // 'Office' | 'Remote' | etc.
//     notes: { type: String },
//   },
//   { timestamps: true }
// );

// export default mongoose.model('Attendance', AttendanceSchema);




import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  checkIn: { 
    type: String, 
    default: null 
  },        // e.g., "09:15"
  checkOut: { 
    type: String, 
    default: null 
  },
  totalHours: { 
    type: String, 
    default: null 
  },
  status: { 
    type: String, 
    enum: ['P', 'A', 'H', 'W', 'LH', 'HD', 'PW', 'PH', 'PHW', 'XX', 'CL', 'HCL'], 
    default: "NotDefined" 
  },

  date: { 
    type: Date, 
    required: true 
  },
  month: { 
    type: String 
  },           // "March-2026"
  year: { 
    type: Number 
  },
  notes: { 
    type: String, 
    default: null 
  },
  location: { 
    type: String, 
    default: "Bhopal" 
  }
}, { 
  timestamps: true 
});

AttendanceSchema.pre('save', function(next) {
  if (this.date) {
    const d = new Date(this.date);
    const monthNames = ["January","February","March","April","May","June",
                       "July","August","September","October","November","December"];
    
    this.month = `${monthNames[d.getMonth()]}-${d.getFullYear()}`;
    this.year = d.getFullYear();
  }
  next();
});

// Unique index to prevent duplicate attendance for same employee + date
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', AttendanceSchema);