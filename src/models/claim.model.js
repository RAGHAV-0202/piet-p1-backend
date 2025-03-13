import mongoose from "mongoose";

const claimSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    numberOfAuthors: {
        type: Number,
        required: true
    },
    authors: {
        type: [String],
        required: true
    },
    publicationDate: {
        type: Date,
        required: true
    },
    webLink: {
        type: String,
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    calculatedAmount: {
        type: Number,
        required: true
    },
    paperFront: { type: String, required: true },
    claimProof: { type: String, required: true }  
}, { timestamps: true });

const Claim = mongoose.model("Claim", claimSchema);
export default Claim;
