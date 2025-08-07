import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
dotenv.config()

const UserSchema = new mongoose.Schema({
    fullName : {
        type : String ,
        required : [true , "Full name is required"]
    },
    email : {
        type : String ,
        required : [true , "Full name is required"]
    },
    password : {
        type : String , 
        required : [true , "Password is required"]   
    },
    department: {
        type: String,
        required: [true, "Department is required"],
        enum: ["CSE", "AIML", "AIDS", "CYS", "IT", "ME", "TEXTILE", "CIVIL" , "PHARMACY" , "DCA"],
    },
    designation : {
        type : String , 
        required : [true , "Designation is required"]   
    },
    employeeId : {
        type : String , 
        required : [true , "Employee ID is required"]   
    },
    scopusId : {
        type : String , 
        required : [true , "Scopus ID is required"]   
    },
    vidhwanId : {
        type : String , 
        required : [true , "Vidhwan ID is required"]   
    },
    orcidId : {
        type : String , 
        required : [true , "Orcid ID is required"]   
    },
    bankAccount : {
        type : Number , 
        required : [true , "BankAccount is required"]   
    },
    ifsc : {
        type : String , 
        required : [true , "BankAccount is required"]  
    },
    branch : {
        type : String , 
        required : [true , "BankAccount is required"]  
    },
    profileImage : {
        type : String ,
        default : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    },
    claims: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Claim"
    }]  


} , {timestamps : true})

// UserSchema.pre("save" , async function(next){
//     console.log("original password : " , this.pasword);

//     this.password = await bcrypt.hash(this.password , 10);
//     console.log("Hashed Password : " , this.password)
//     next()
// })

UserSchema.methods.isPasswordCorrect = async function (password){
    // console.log("line 70 from model " + password , this.password)
    // return await bcrypt.compare(password, this.password);

    return password == this.password
}

UserSchema.methods.generateAccessToken = async function(){
    return jwt.sign(
        {_id : this._id , email : this.email , fullName : this.fullName } , process.env.ACCESS_TOKEN_SECRET , {expiresIn : process.env.ACCESS_TOKEN_EXPIRY}
    )
}

const User = mongoose.model("User" , UserSchema)
export default User

