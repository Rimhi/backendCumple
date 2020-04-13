'use strict'

var bcrypt = require('bcrypt-nodejs');
var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var UserProfile = require('../models/userProfile');
var jwt = require('../services/jwt');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');


function saveUser(req, res){
	var params = req.body;
	var user = new User();
	if(params.name && params.surname && params.nick && params.email && params.password){
		user.name = params.name;
		user.surname = params.surname;
		user.nick = params.nick;
		user.email = params.email;
		user.role = "ROLE_USER";
		user.image = null;

		User.find({ $or: [
			{email: user.email.toLowerCase()},
			{nick: user.nick.toLowerCase()}
			]}).exec((err,users)=>{
				if(err) return res.status(500).send({message:'Error en la verificacion de duplicado',err});
				if(users && users.length>=1){
					return res.status(200).send({message:'El usuario ya existe'});
				}else{
						bcrypt.hash(params.password,null,null,(err,hash)=>{
						if(err) return res.status(500).send({message:'Error al encriptar',err});
							
						
						user.password = hash;
						user.save((err,userStored)=>{
							if(err) return res.status(500).send({message:'Error en el servidor',err});


							if(userStored){ res.status(200).send({message:'Registrado con éxito!',user: userStored});
							}else{ res.status(404).send({message:"Error  en el registro"});}
							
						
						});
						
					});
				}
			});
	

	}else{
		res.status(200).send({message:'Los campos son Obligatorios'});
	}
}
function loginUser(req, res){
var params = req.body;

var email = params.email;
var password = params.password;

User.findOne({email:email},(err,user)=>{
	if(err) return res.status(500).send({message:"error en el servidor",err});
	if(user){
		bcrypt.compare(password,user.password,(err,check)=>{
			if(check){
				if(params.gettoken){
					return res.status(200).send({
						token: jwt.createToken(user),message:"Bienvenido!"
					});
				}else{
					user.password = undefined;
					return res.status(200).send({message:"Bienvenido!",user});
				}
			}else{
				return res.status(200).send({message:"Usuario o contraseña incorrectos!"});
			}
		});
	}else{
		return res.status(200).send({message:"Usuario o contraseña incorrectos!"});
	}
});

}
function getUser(req,res){
	var userId = req.params.id;
	//console.log(userId);
	User.findById(userId,(err,user)=>{
		if(err) return res.status(500).send({message:"Error en la peticion",err});
		
		if(!user) return res.status(404).send({message:"No se encuetra el Usuario"});

			followThisUser(req.user.sub,userId).then((value)=>{
				user.password = undefined;
			return res.status(200).send({user,"following":value.following,"followed":value.followed});
		});

		
	});
}
async function followThisUser(identity_user_id, user_id) {
   var following = await Follow.findOne({ user: identity_user_id, followed: user_id }).exec()
       .then((following) => {
           return following;
       })
       .catch((err) => {
           return handleError(err);
       });
   var followed = await Follow.findOne({ user: user_id, followed: identity_user_id }).exec()
       .then((followed) => {
           return followed;
       })
       .catch((err) => {
           return handleError(err);
       });
 
   return {
       following: following,
       followed: followed
   };
}

function getUsers(req,res){
	var user_id = req.user.sub;

	var page = 1;
	if(req.params.page){
		page = req.params.page;
	}
	var itemsPerPage = 50;

	User.find().sort('_id').paginate(page,itemsPerPage,(err,users,total)=>{
		if(err) return res.status(500).send({message:"Error en la peticion",err});
		if(!users) return res.status(404).send({message:"No hay Usuarios"});

		followUserIds(user_id).then((response)=>{
			return res.status(200).send({message:"Resultados",users,users_following: response.following,users_followed: response.followed,total,pages: Math.ceil(total/itemsPerPage)});
		});
	});
} 

async function followUserIds(user_id){
	if(user_id.match(/^[0-9a-fA-F]{24}$/)){
	var following = await Follow.find({'user':user_id}).select({'_id':0,'__v':0,'user':0}).exec()
       .then((follows) => {
           return follows;
       })
       .catch((err) => {
           return handleError(err);
       });
	var followed = await Follow.find({followed:user_id}).select({'_id':0,'__v':0,'followed':0}).exec()
	  .then((follows) => {
           return follows;
       })
       .catch((err) => {
           return handleError(err);
       });
	
	var following_clean = [];

		following.forEach((follow)=>{
			following_clean.push(follow.followed);
		});
		var followed_clean = [];

		followed.forEach((follow)=>{
			followed_clean.push(follow.user);
		});
		//console.log(following_clean);
	return {following: following_clean,followed:followed_clean}
	}else{
		return {message:'id no vaido'}
	}

}

function updateUser(req,res){
	var user_id = req.user.sub;
	var update = req.body;
	
	delete update.password;
	User.findOne({email:update.email}).exec((err,user)=>{
		if(!user || user_id==user._id){
			User.findOne({nick:update.nick}).exec((err,user2)=>{
				if(!user2 || user_id==user2._id){
					update.image = undefined;
					User.findByIdAndUpdate(user_id,update,{new:true},(err,userUpdated)=>{
						if(err) return res.status(500).send({message:"Error en la peticion",err});
						
						if(!userUpdated) return res.status(404).send({message:"No se encuetra el Usuario"});
						userUpdated.password = undefined;
						return res.status(200).send({user:userUpdated,message:"Actualizado con Exito!"});

					});
				}else{
					return res.status(200).send({message:"Este nick ya existe"});
				}
			});
		}else{
			return res.status(200).send({message:"Este email ya existe"});
		}
	});
	

}

function uploadImage(req,res){
	var user_id = req.user.sub;
	if(req.files){
		var file_path = req.files.image.path;
		var file_split = file_path.split('\\');
		var file_split = file_split[2];
		var file_split = file_split.split('\.');
		var file_name = file_split[0];
		var file_ext = file_split[1];
		console.log(file_name+'.'+file_ext);
		if(file_ext == 'png' || file_ext=='jpg' || file_ext=='jpeg' || file_ext=='gif'){
			User.findByIdAndUpdate(user_id,{image:file_name+'.'+file_ext},{new:true},(err,userUpdated)=>{
				if(err) return res.status(500).send({message:"Error en la peticion",err});
		
				if(!userUpdated) return res.status(404).send({message:"No se encuetra el Usuario"});

				userUpdated.password = undefined;
				var userProfile = new UserProfile();
				userProfile.user = user_id;
				userProfile.image = userUpdated.image;
				userProfile.save((err,userProfileStored)=>{
					if(err){ 
						fs.unlink(file_path,(err)=>{
							return res.status(200).send({message:'La imagen no se pudo subir'});
						});
					}
					return res.status(200).send({message:"imagen Actualizada","user":userUpdated});
				});
				
			});
		}else{
			fs.unlink(file_path,(err)=>{
				return res.status(200).send({message:'Le extención no es valida'});
			});
		}
	}else{
		return res.status(200).send({message:'No se ha subido la imagen'});
	}
}

function getImageFile(req,res){
	
	
	if(req.params.imageFile){
		var path_file = './uploads/users/'+req.params.imageFile;
	}else if(req.user){
		var image_file = req.user.image;
		var path_file = './uploads/users/'+image_file;
	}else{
		return res.status(404).send({message:"Ups! Inicia session o busca una imagen valida"});
	}

	fs.exists(path_file,(exists)=>{
		if(exists){
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(404).send({message:"la imagen no existe",path_file});
		}
	});
}
function getCounters(req,res){
	var user_id = req.user.sub;

	if(req.params.id){
		user_id = req.params.id;
	} 
	getCountFollow(user_id).then((value)=>{
		return res.status(200).send({counters:value})
	});
	
}
async function getCountFollow(user_id){
	var following = await Follow.countDocuments({user:user_id}).exec().then((value)=>{
		return value;
	}).catch((err) => {
         return handleError(err);
    });
    var followed = await Follow.countDocuments({followed:user_id}).exec().then((value)=>{
		return value;
	}).catch((err) => {
         return handleError(err);
    });
    var publications = await Publication.countDocuments({'user':user_id}).exec().then((value)=>{
		return value;
	}).catch((err) => {
         return handleError(err);
    });
    return {following,followed,publications}
}
module.exports = {
	saveUser,
	loginUser,
	getUser,
	getUsers,
	updateUser,
	uploadImage,
	getImageFile,
	getCounters
}