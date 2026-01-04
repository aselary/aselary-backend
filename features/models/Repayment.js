import mongoose from 'mongoose';

const RepaymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, index: true, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true, index: true },
    paidDate: { type: Date }, // if paid set this 
}, { timestamps: true });

const Repayment = mongoose.model('Repayment', RepaymentSchema);

export default Repayment;