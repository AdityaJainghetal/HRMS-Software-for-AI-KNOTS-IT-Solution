// import mongoose from "mongoose";

// const TaskSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     category: {
//       type: String,
//       enum: [
//         "Video Editing",
//         "Developer",
//         "Tender",
//         "Interview",
//         "Calling",
//         "SEO",
//         "Design",
//         "Multipurpose",
//         "Backend",

//       ],
//       required: true,
//     },

    
//     description: {
//       type: String,
//       default: "",
//     },
//     assignedTo: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Employee",
//       default: null,
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Employee",
//       required: true,
//     },
//     dateTime: {
//       type: Date,
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ["pending", "inprogress", "completed"],
//       default: "pending",
//     },
//     priority: {
//       type: String,
//       enum: ["low", "medium", "high"],
//       default: "medium",
//     },
//   },
//   {
//     timestamps: true,
//   },
// );

// export default mongoose.model("Task", TaskSchema);


import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Video Editing", "Interview", "Calling", "Developer", "SEO",
        "Design", "Multipurpose", "Backend", "Tender"
      ],
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    // New Fields
    startDateTime: {
      type: Date,
      default: Date.now,        // Auto set when task is created
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "inprogress", "completed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Task", TaskSchema);