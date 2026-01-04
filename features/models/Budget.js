import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref:
        "User", index: true, required: true },
        month: { type: String, required: true }, // 'YYYY-MM'
category: {
    type: String,
    enum:
    ["House","Food","Transport","Health","Entertainment","Savings"],
    required: true
},

target: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Budget", BudgetSchema);