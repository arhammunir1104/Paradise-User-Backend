let express = require("express");
require("dotenv").config();
let app  = express();
let PORT = process.env.PORT || 4000;
let bodyParser = require('body-parser');
let path = require("path");
let bcrypt = require("bcryptjs");
let verification = require("./src/middleware/verification");
let cors = require("cors")

// Database
let db = require("./src/db/db")
let UserData = require("./src/model/UserData");
let RoomData = require("./src/model/RoomData");
let HotelData = require("./src/model/HotelData");
let ReservationDetails = require("./src/model/ReservationDetails");
const userData = require("./src/model/UserData");

// Middlewares 
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json());

//Cors
let userURL = "http://localhost:5173";
let corsOptions = {
    origin: userURL,
    methods: "GET, POST, PUT, DELETE, PATCH, HEAD",
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin', ],
    credentials: true,
    optionsSuccessStatus: 204
}
app.use(cors(corsOptions))


//Routing
app.get("/", (req, res)=>{
    console.log("Requested");
    // res.send("Hello from the backend");
    res.status(200).json({msg: "Fetched Data Successfully" ,data : "Hello world"}); 
});


app.post("/verify", (req, res)=>{
    async function v(){
        let {token} = req.body;
        console.log(token);
        try{
            let verify = await verification({token: token});
            console.log(verify);
            
            if(verify.verified === true  || verify.verified){
                // res.status(200).json({msg: "LoggedIn", verified: true});
                res.status(200).json({msg: "Logged in Successfully" ,verified: true}); 

            }
            else{
                res.status(400).json({msg: "Login First", verified: false});
                res.status(200).json({msg: "You are not Logged in, please login first" ,verified: false}); 

            }
        }
        catch(e){
            console.log("Verification Error", e);
        }
    };
    v();

});

app.post("/register", (req, res)=>{
    let {name, email, phone, cnic, city, password} = req.body;
    console.log(req.body);
    async function InserData(){
        try{
            let data = await UserData.create({
                name, email, phone, cnic, city, password
            });
            console.log(data);
            let token = await data.generateAuthToken();
            console.log("Token in Backend", token); // Checking if token is retrieveing in backend 
            console.log("Data Saved", data);  // Checking if data is saved in database
            // res.send("User Registered")
            res.status(200).json({msg: "Account Created Successfully", status: true, token: token});
        }
        catch(e){
            if(e.code === 11000){
            console.log("Email is already exists");
            // res.send("Email already exists");
            res.status(200).json({msg: "This email already exists.", status: false, token: ""});
            // res.status(400).json({msg: "Email is already exists", verified :false, cause : true});
            
            // res.send("Email Already Exists")
            }
            else{
                console.log("Inserting Data Error", e.message);
                // res.send("User registering error", e);
                res.status(200).json({msg: "Error Occured while saving data, please try again in few minutes.", status: false, token: ""});
                // res.status(400).json({msg: "Server Error, Please Try Again Later!", verified :false, cause : true});
            }
        }
    };
    InserData();
});


app.post("/login", (req, res)=>{
    let {email, password} = req.body;
    console.log(req.body);

    async function userlogin(){
        try{
            let data = await UserData.findOne({email: email});
            if(data !== null){
                console.log(data);
                let verify = await bcrypt.compare(password, data.password);
                if(verify === true || verify){
                    let token = await data.generateAuthToken();
                    console.log("Login Token", token);
                    // res.send("User Loggedin Successfully");
                    res.status(200).json({msg : "Loggedin Successfully", status: true, token: token});
                }
                else{
                    console.log("Wrong Email or password");
                    // res.send("Wrong Email or password");
                    res.status(200).json({msg : "Wrong Email or Password", status: false, token: ""});
                }

            }
            else{
                console.log("Account not found");
                // res.send("Account not found");
                res.status(200).json({msg : "Wrong Email or Password", status: false, token: ""});
            }            
        }
        catch(e){
            console.log("User Login Error", e);
            return("User Login Error", e);
        }
    };
    userlogin();
});

app.post("/logout", (req, res)=>{
    let {token} = req.body;
    console.log(req.body);
    async function logout(){
        try{
            let verify = await verification({token: token});
            let delete_data = await UserData.findOne({_id: verify._id});
            let d = delete_data.tokens.filter((val)=>{
                if(val.token !== token){
                    return(val);
                }
            });
            console.log(d);
            let loggingout = await UserData.findByIdAndUpdate({_id: verify._id}, {
                $set: {
                    tokens: d
                }
            });
            console.log(loggingout);
                res.status(200).json({msg: "Logged Out", status: true}) //Checking if the data has been updated

        }
        catch(e){
            console.log("Logging out error", e);
            res.status(200).json({msg: "Error while logging out", status: false})
        }
    };
    logout();

});

app.get("/getData", (req, res)=>{
    async function getData(){
        try{
            // console.log(data);
            
            let karachi = await RoomData.find({$and: [{admin_access: "active"}, {room_status: "active", room_city: "karachi"}]}).sort({creationData: -1}).select({_id: 1, room_title: 1, room_add : 1,  room_city: 1, room_main_img: 1, room_price: 1, room_dis_price: 1, room_type: 1, room_bed: 1,}).limit(4);
            let lahore =  await RoomData.find({$and: [{admin_access: "active"}, {room_status: "active", room_city: "lahore"}]}).sort({creationData: -1}).select({_id: 1, room_title: 1, room_add : 1,  room_city: 1, room_main_img: 1, room_price: 1, room_dis_price: 1, room_type: 1, room_bed: 1,}).limit(4);
            let islamabad =  await RoomData.find({$and: [{admin_access: "active"}, {room_status: "active", room_city: "islamabad"}]}).sort({creationData: -1}).select({_id: 1, room_title: 1, room_add : 1,  room_city: 1, room_main_img: 1, room_price: 1, room_dis_price: 1, room_type: 1, room_bed: 1,}).limit(4);
            let rawalpindi =  await RoomData.find({$and: [{admin_access: "active"}, {room_status: "active", room_city: "rawalpindi"}]}).sort({creationData: -1}).select({_id: 1, room_title: 1, room_add : 1,  room_city: 1, room_main_img: 1, room_price: 1, room_dis_price: 1, room_type: 1, room_bed: 1,}).limit(4);
            let allData =  await RoomData.find({$and: [{admin_access: "active"}, {room_status: "active",}]}).sort({creationData: -1}).select({_id: 1, room_title: 1, room_add : 1,  room_city: 1, room_main_img: 1, room_price: 1, room_dis_price: 1, room_type: 1, room_bed: 1,}).limit(20);
            console.log(allData);
            console.log(karachi);
            console.log(lahore);
            console.log(islamabad);
            console.log(rawalpindi);
            res.status(200).json({msg: "All Data Found Successfully", status: true ,karachi: karachi, lahore: lahore, islamabad: islamabad, rawalpindi: rawalpindi, allData:allData})
        }   
        catch(e){
            console.log("Room data fetching error", e);
            res.status(200).json({msg: "No Found Successfully", status: false, karachi: [], lahore: [], islamabad: [], rawalpindi: [], allData:[]})
        }
    };
    getData();
});

app.get("/room/:id", (req, res)=>{

    let room_id= req.params.id;
    console.log(req.params);
    async function getRoom(){
        try{
            let data = await RoomData.findOne({$and: [{admin_access:"active" } , {room_status: "active"},{_id: room_id}]}).select({room_total_revenue: 0, reservationDetails:0});
            // console.log(data);
            console.log("Room Data found");
            let moreRooms = await RoomData.find({$and: [{admin_access:"active" } , {room_status: "active"},{room_city: data.room_city}]}).sort({creationData: -1}).limit(8).select({_id: 1, room_title: 1, room_add : 1,  room_city: 1, room_main_img: 1, room_price: 1, room_dis_price: 1, room_type: 1, room_bed: 1,});
            // console.log("MoreRooms", moreRooms.length)
            if(data !== null || data.length>0){
                // console.log("sending response");
                res.status(200).json({msg: "All Data Found Successfully", status: true ,data: data, moreRooms: moreRooms})
            }
            else{
                res.status(200).json({msg: "This room is may be temporarily unavailable, or you have entered an invalid URL.", status: false ,data: [], moreRooms: []})
            }
            

        }
        catch(e){
            console.log("Fetching Room Data Error", e);
            res.status(200).json({msg: "This room is may be temporarily unavailable, or you have entered an invalid URL.", status: false ,data: [], moreRooms: []})
        }
    };
    getRoom();

});

app.get("/search/rooms/:city", (req, res)=>{

    let room_city= req.params.city;
    console.log(req.params);
    async function getRoom(){
        try{
            if(room_city === "all"){
                let data = await RoomData.find({$and: [{admin_access:"active" } , {room_status: "active"}]}).sort({creationData: -1}).limit(40).select({room_total_revenue: 0, reservationDetails:0});
                console.log(data);
                if(data !== null || data.length>0){
                    res.status(200).json({msg: "All Data Found Successfully", status: true ,data: data,})
                }
                else{
                    res.status(200).json({msg: "No room found for this city, kinldy search another city.", status: false ,data: []})
                }

            }
            else{
                let data = await RoomData.find({$and: [{admin_access:"active" } , {room_status: "active"},{room_city: room_city}]}).sort({creationData: -1}).limit(20).select({room_total_revenue: 0, reservationDetails:0});
                console.log(data);
                if(data !== null || data.length>0){
                    res.status(200).json({msg: "All Data Found Successfully", status: true ,data: data,})
                }
                else{
                    res.status(200).json({msg: "No room found for this city, kinldy search another city.", status: false ,data: []})
                }

            }
        }
        catch(e){
            console.log("Fetching Room Data Error", e);
            res.status(200).json({msg: "No room found for this city, kinldy search another city.", status: false ,data: []})
        }
    };
    getRoom();

});

app.get("/hotel/:id", (req, res)=>{

    let hotel_id= req.params.id;
    console.log(hotel_id);
    async function getHotel(){
        try{
            let data = await HotelData.findOne({$and :[{admin_access: "active"} , {hotel_status: "completed"} ,{_id: hotel_id}]}).select({ hotel_total_revenue: 0, tokens: 0, hotel_password: 0, admin_access: 0, hotel_status: 0, hotel_rooms: 0});
            let hotelRooms = await RoomData.find({$and :[{admin_access: "active"} , {room_status: "active"} ,{hotel_id: data._id}]}).sort({creationData: -1}).select({_id: 1, room_title: 1, room_add : 1,  room_city: 1, room_main_img: 1, room_price: 1, room_dis_price: 1, room_type: 1, room_bed: 1,});
            console.log(data);
            if(data !== null || data.length>0){
                res.status(200).json({msg: "All Data Found Successfully", status: true ,data: data, rooms: hotelRooms});
            }
            else{
                res.status(200).json({msg: "This Hotel is may be temporarily unavailable, or you have entered an invalid URL.", status: false ,data: [], rooms: []});
            }
            // res.send("Hotel data found");
        }
        catch(e){
            console.log("Fetching Hotel Data Error", e);
            res.status(200).json({msg: "This Hotel is may be temporarily unavailable, or you have entered an invalid URL.", status: false ,data: [], rooms: 0});
        }
    };
    getHotel();

});



app.post("/check/", (req, res)=>{
    console.log(req.body);
    let room_id = req.body.room_id;
    let userstartingdate= req.body.starting;
    let userendingdate= req.body.ending;
    let s = new Date(userstartingdate);   //Converting user requested reserving starting date into ms
    let e = new Date(userendingdate);     //Converting user requested reserving ending date into ms
    console.log(userstartingdate, userendingdate);
    console.log(s, e);
    console.log(userstartingdate < userendingdate);

    async function check(){
        try{
            let data = await RoomData.findOne({_id: room_id});
            let reservationdata= data.reservationDetails;
            

            let i=0;
            let c;
            let sdate;
            let edate;

            if(reservationdata.length> 0){
                let i=0;
            let c;
            let sdate;
            let edate;
            for(i; i<reservationdata.length; i++ ){
                    console.log(reservationdata[i]);
                    c = true;
                    let rs = new Date(reservationdata[i].starting);  //Converting already reserved starting date into ms
                    let re = new Date(reservationdata[i].ending);  //Converting already reserved ending date into ms;
                    if(!(((rs>s) && (rs > e)) || ((re <s) && (re<e) ))){
                        c= false
                        sdate = reservationdata[i].starting;
                        edate = reservationdata[i].ending;
                    };

                    if(c === false || !c){
                        break;
                    }
            };

            if(c === false || !c){
                console.log(`You cannot book the room because someone has already book the room from ${sdate} to ${edate}`);
                console.log(c);
                console.log(sdate);
                console.log(edate);
                res.status(200).json({msg: `You cannot book the room because someone has already book the room from ${sdate} to ${edate}, Please Search for another room.`, status: false});
                // res.send(`You cannot book the room because someone has already book the room from ${sdate} to ${edate}`)
            }
            else{
                console.log(`The room is available for booking according to your Reservation Dates:  ${userstartingdate} to ${userendingdate}`);
                console.log(c);
                console.log("");
                console.log("");
                res.status(200).json({msg: `The room is available for booking according to your Reservation Dates:  ${userstartingdate} to ${userendingdate}`, status: true});
                // res.send(`You can book the room because none has already book the room from ${userstartingdate} to ${userendingdate}`);
            };
            }
            else{
                console.log(`You can book the room because none has already book the room from ${userstartingdate} to ${userendingdate}`);
                console.log(c);
                console.log("");
                console.log("");
                res.status(200).json({msg: `The room is available for booking according to your Reservation Dates:  ${userstartingdate} to ${userendingdate}`, status: true});
                // res.send(`You can book the room because none has already book the room from ${userstartingdate} to ${userendingdate}`);
            

            }

        }
        catch(e){
            console.log("Reservation checking Error", e);
        }
    };
    check();
});

app.post("/confirmreservation", (req, res)=>{
    console.log(req.body);
    let {
        room_id,
        room_price,
        user_id,
        starting,
        ending,
        total_days,
        total_price
    } = req.body;
    console.log(req.body);

    async function confirm(){
        try{
            let roomdata = await RoomData.findOne({_id: room_id}).select({room_total_revenue: 0,});            
            let userdata = await UserData.findOne({_id: user_id});
            console.log(user_id);
            console.log(roomdata);
            let reservationdata= await ReservationDetails.create({
                room_id : room_id,
                hotel_id: roomdata.hotel_id,
                room_main_img : roomdata.room_main_img,
                room_price : room_price,
                room_title : roomdata.room_title,
                hotel_logo : roomdata.hotel_data[0].hotel_logo,
                user_id : user_id,
                user_name : userdata.name,
                user_email : userdata.email,
                user_phone : userdata.phone,
                user_cnic : userdata.cnic,
                reservation_status : "pending",
                starting : starting,
                ending : ending,
                total_days : total_days,
                total_price : total_price
            });
            let newreservation ={
                _id: reservationdata._id,
                room_price : room_price,
                user_id : user_id,
                user_name : userdata.name,
                user_email : userdata.email,
                user_phone : userdata.phone,
                user_cnic : userdata.cnic,
                reservation_status : "pending",
                starting : starting,
                ending : ending,
                total_days : total_days,
                total_price : total_price

            } 
            console.log("Room DAta",roomdata);
            console.log("Reservation DAta",reservationdata);
            console.log(roomdata.reservationDetails);
            roomdata.reservationDetails.push(newreservation);
            userdata.reservationHistory.push({reservation_id: reservationdata._id});
            await roomdata.save();
            await userdata.save();
            console.log("Room DAta",roomdata);
            console.log("Reservation DAta",reservationdata);
            // console.log("Reservation Saved");
            res.status(200).json({msg: "Your Reservation has been Confirmed.", status: true});
            // res.send("Reservation Saved");
        }
        catch(e){
            console.log("Reservation checking Error", e);
            res.status(200).json({msg: "Some Error Occured While reserving your room.", status: false});
        }
    };
    confirm();
});

app.post("/userData", (req, res)=>{
    async function getData(){
        let {token} = req.body;
        console.log(req.body);
        try{
            let verify = await verification({token: token});
            console.log(verify);
            let data = await userData.findOne({$and:[{admin_access : "active"} , {_id: verify._id}]}).select({password: 0, type: 0, reservationHistory: 0, tokens: 0});
            if(data === null){
                res.status(200).json({msg: "Your account has been blocked, kindly contact +92 301 2865 213 to activate your account", status: false, data: []});
            }
            else{
                console.log(data);
                res.status(200).json({msg: "User Data Found.", status: true, data: data});
            }

        }
        catch(e){
            console.log("Error while finding userData", e);
        }


    };
    getData();
})

app.post("/reservationhistory", (req, res)=>{
    async function gethistory(){
        let token = req.body.token;
        let verify = await verification({token: token});
        try{
            let data = await ReservationDetails.find({$and: [{ user_id: verify._id}]}).sort({creationData : -1}).select({user_cnic: 0, user_email: 0, user_id: 0 , user_name:0 , user_phone : 0});
            console.log(data);
            if(data !== null){
                res.status(200).json({msg: "Reservation Data Found", data: data , status: true});
            }
            else{
                res.status(200).json({msg: "No Reservation Data Found.", data: [] , status: false});
            }
            // res.send("All the data found for user");
        }
        catch(e){
            console.log("User reservation history finding error", e);
            res.status(200).json({msg: "No Reservation Data Found.", data: [] , status: false});
        }
    };
    gethistory();
});

app.get("/search/:city/:starting/:ending/:bed/:type", (req, res)=>{

    let {city, starting, ending, bed, type} = req.params;
    console.log(req.params);
    let s = new Date(starting);   //Converting user requested reserving starting date into ms
    let e = new Date(ending);     //Converting user requested reserving ending date into ms
    async function search(){
        try{
            let data = await RoomData.find({$and : [{admin_access: "active"}, {room_status : "active"} ,{room_city: city},{room_bed: bed}, {room_type: type}]});
            console.log(data.length);
            let d = data.filter((val, i)=>{
                if(val.reservationDetails.length<1){
                    return(val)
                }
                else{
                    let i=0;
                    let c;
                    let sdate;
                    let edate;
                    for(i; i<val.reservationDetails.length; i++ ){
                        c = true;
                        let rs = new Date(val.reservationDetails[i].starting);  //Converting already reserved starting date into ms
                        let re = new Date(val.reservationDetails[i].ending);  //Converting already reserved ending date into ms;
                        console.log(rs, re, s, e);
                        if(!(((rs>s) && (rs > e)) || ((re <s) && (re<e) ))){
                            c= false
                            sdate = val.reservationDetails[i].starting;
                            edate = val.reservationDetails[i].ending;
                            console.log(val.reservationDetails[i]);
                        };
    
                        if(c === false || !c){
                            break;
                        }
                };
                console.log(c);
                if(c===true){
                    console.log(val.reservationDetails);
                    return(val)
                }

                }
            });
            console.log("Available Rooms",d , d.length);
            if(d.length> 0){
                res.status(200).json({msg: "Data Found", status: true, data:d});
            }
            else{
                res.status(200).json({msg: "No Data Found, please Try Different Search.", status: false, data:[]});
            }
        }
        catch(e){
            console.log("Searching error", e);
            res.status(200).json({msg: "No Data Found, please Try Different Search.", status: false, data:[]})
        };
    };
    search();
});

app.post("/addComment", (req, res)=>{
    let {token, room_id, user_message} = req.body;
    console.log(req.body);
    async function addComment(){
        try{
            let verify = await verification({token: token}); 
            console.log(verify);  
            let data = await ReservationDetails.find({$and: [{room_id: room_id}, {user_id: verify._id}]});
            console.log( "Data" , data);
            let room = await RoomData.findOne({_id: room_id}).select({comments: 1, total_comments: 1});
            console.log(room);
            let userData = await UserData.findOne({admin_access: "active", _id: verify._id}).select({_id: 1, name: 1});
            if(data === null || data.length<1){
                //  res.send("You are not allowed to submit a feedback.You have not booked t+he room.")
                res.status(200).json({msg: "You are not allowed to submit a feedback.You have not booked the room.", status: false});
            }
            else{
                let comment ={
                    room_id: room_id,
                    user_id: userData._id,
                    user_name: userData.name,
                    user_message: user_message
                }
                room.total_comments++;
                room.comments.push(comment);
                await room.save();

                res.status(200).json({msg: "Your comment has been saved", status: true});
            }
        }
        catch(e){
            console.log("Error while adding comments", e);
        }
    };
    addComment();
})


app.listen(PORT, ()=>{
    console.log(`PORT is active on port no ${PORT}`);
})