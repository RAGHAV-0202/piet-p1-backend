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
    category : {
        type: [String],
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
    totalAmount : {
        type: Number,
        // required: true
    },
    status : {
        type : String , 
        default : "Submitted" , 
        enum: ["Submitted", "Processed"]
    },
    paperFront: { type: String, required: true },
    claimProof: { type: String, required: true }  
}, { timestamps: true });

// claimSchema.pre("save", function (next) {
//   this.totalAmount = this.calculatedAmount * this.numberOfAuthors;
//   console.log(this.totalAmount)
//   next();
// });

const Claim = mongoose.model("Claim", claimSchema);
export default Claim;
