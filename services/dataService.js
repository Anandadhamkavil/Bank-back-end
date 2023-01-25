// import db.js
const db = require('./db')

// import jsonwebtoken
const jwt = require('jsonwebtoken') 

// register
const register = (uname,acno,pswd)=>{
    console.log('Inside register function in data service');
    // asynchronus function
    // check acno is in mongodb  - db.users.findOne()
    return db.User.findOne({
        acno
    }).then((result)=>{
        console.log(result);
        if(result){
            // acno already exist
            return{
                statusCode:403,
                message:'Account Already exist!!'
            }
        }
        else{
            // to add new user
            const newUser = new db.User({
                username:uname,
                acno,
                password:pswd,
                balance:0,
                transaction:[] 
            })
            // to save new user in mongodb use save()
            newUser.save()
            return{
                statusCode:200,
                message:'Registration Successfull.....'
            }
            }
    })
}

// login
const login = (acno,pswd)=>{
console.log('Inside login function body');
// check acno,pswd in mongodb
return db.User.findOne({
    acno,
    password:pswd,
}).then((result)=>{
        if(result){
            // generate token
             const token = jwt.sign({
                currentAcno:acno
             },'supersecretkey123')
            return{
                statusCode:200,
                message:'Login Successfull.....',
                username:result.username,
                currentAcno:acno,
                token
            }
        }
        else{
            return{
                statusCode:404,
                message:'Invalid Account / Password'
            }
        }
    }
)
}

// getBalance
const getBalance = (acno)=>{
   return db.User.findOne({
        acno
    }).then((result)=>{
        if(result){
            return {
                statusCode:200,
                balance:result.balance
            }
        }
        else{
            return{
                statusCode:404,
                message:'Invalid Account'
            }
        }
    })
}

// deposit
const deposit = (acno,amt)=>{
    let amount = Number(amt)
    return db.User.findOne({
        acno 
    }).then((result)=>{
        if(result){
            // acno is present in db
            result.balance += amount
            result.transaction.push({
                type:"CREDIT",
                fromacno:acno,
                toacno:acno,
                amount
            })
            // to update in mongodb
            result.save()
            return{
                statusCode:200,
                message:`${amount} successfully deposited...`
            } 
        }
        else{
            return{
                statusCode:404,
                message:'Invalid Account'
            }
        }
    })
}

// fundTransfer
const fundTransfer = (req,toacno,pswd,amt)=>{
    let amount = Number(amt)
    let fromacno = req.fromacno
    return db.User.findOne({
        acno:fromacno,
        password:pswd
    }).then((result)=>{
        console.log(result);
        if(fromacno==toacno){
            return{
                statusCode:401,
                message:"Permission denied due to own account transfer!!"
            }
        }
        if(result){
            // debit account details
            let fromacnoBalance = result.balance
            if(fromacnoBalance>=amount){
            result.balance = fromacnoBalance-amount
            // credit account details
            return db.User.findOne({
                acno:toacno
            }).then((creditdata)=>{
                if(creditdata){
                 creditdata.balance += amount
                 creditdata.transaction.push({
                    type:"CREDIT",
                    fromacno,
                    toacno,
                    amount
                 })
                 creditdata.save();
                 result.transaction.push({
                    type:"DEBIT",
                    fromacno,
                    toacno,
                    amount
                 })
                 result.save();
                 return{
                    statusCode:200,
                    message:"Amount Transfer successfully.."
                 }
                }
                else{
                    return{
                        statusCode:401,
                        message:"Invalid Credit Account Number"
                    } 
                }
            })
            }
            else{
                return{
                    statusCode:403,
                    message:"Insufficient Balance"
                }
            }
        }
        else{
            return{
                statusCode:401,
                message:"Invalid Debit Account Number / Password"
            }
        }
    })
}

// getAllTransactions
const getAllTransactions = (req)=>{
let acno = req.fromacno
return db.User.findOne({
    acno
}).then((result)=>{
    if(result){
        return{
            statusCode:200,
            transaction:result.transaction
        }
    }
    else{
        return{
            statusCode:401,
            message:"Invalid Account Number"
        }
    }
})
}

// deleteMyAccount
const deleteMyAccount = (acno)=>{
return db.User.deleteOne({
    acno
}).then((result)=>{
    if(result){
        return{
            statusCode:200,
            message:"Account Deleted Successfully"
        }
    }
    else{
        return{
            statusCode:401,
            message:"Invalid Account"
        }
    }
})
}

// export 
module.exports={
    register,
    login,
    getBalance,
    deposit,
    fundTransfer,
    getAllTransactions,
    deleteMyAccount
}