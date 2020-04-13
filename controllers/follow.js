'use strict'

//var path = require('path');
//var fs = require('fs');
var mongoosePaginate = require('mongoose-pagination');

var Follow = require('../models/follow');
var User = require('../models/user');

function saveFollow(req,res){
	var params = req.body;

	var follow = new Follow();
	follow.user = req.user.sub;
	follow.followed = params.followed;

	follow.save((err,followStored)=>{
		if(err) return res.status(500).send({message:'Error al guardar el seguimiento'});

		if(!followStored) return res.status(404).send({message:"el usuario no existe"});

		return res.status(200).send({follow:followStored,message:"Seguido!"});
	});
}
function deleteFollow(req,res){
	var user_id = req.user.sub;
	var follow_id = req.params.id;

	Follow.find({'user': user_id,'followed': follow_id}).deleteOne((err)=>{
		if(err) return res.status(500).send({message:'Error al dejar de seguir'});

		return res.status(200).send({message:'Ya no lo sigues'});
	});
}
function getFollowingUsers(req,res) {
	var user_id = req.user.sub;

	if(req.params.id && req.params.page) user_id = req.params.id;

	var page = 1;

	if(req.params.page){
		page = req.params.page;
	}else{
		page = req.params.id;	
	}
	var itemsPerPage = 5;

	Follow.find({user:user_id}).populate({path:'followed'}).paginate(page,itemsPerPage,(err,follows,total)=>{
		if(err) return res.status(500).send({message:'Error en la peticion'});
		if(!follows) return res.status(404).send({message:"no sigues usuarios"});
		followUserIds(req.user.sub).then((response)=>{
			return res.status(200).send({message:"Resultados",follows,users_following: response.following,users_followed: response.followed,total,pages: Math.ceil(total/itemsPerPage)});
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
function getFollowedUser(req,res){
	var user_id = req.user.sub;

	if(req.params.id && req.params.page) user_id = req.params.id;

	var page = 1;

	if(req.params.page){
		page = req.params.page;
	}else{
		page = req.params.id;	
	}
	var itemsPerPage = 5;

	Follow.find({followed:user_id}).populate('user').paginate(page,itemsPerPage,(err,follows,total)=>{
		if(err) return res.status(500).send({message:'Error en la peticion'});
		if(!follows) return res.status(404).send({message:"no te siguen usuarios"});
		followUserIds(req.user.sub).then((response)=>{
			return res.status(200).send({message:"Resultados",follows,users_following: response.following,users_followed: response.followed,total,pages: Math.ceil(total/itemsPerPage)});
		});
	});
}
function getMyFollows(req,res){
	var user_id = req.user.sub;
	var find = Follow.find({user:user_id});
	if(req.params.followed){
		var find = Follow.find({followed:user_id});
	}
	find.populate('user followed').exec((err,follows)=>{
		if(err) return res.status(500).send({message:'Error en la peticion'});
		if(!follows) return res.status(404).send({message:"no te siguen usuarios"});

		return res.status(200).send({follows});
	});

}


module.exports = {
	saveFollow,
	deleteFollow,
	getFollowingUsers,
	getFollowedUser,
	getMyFollows
}
