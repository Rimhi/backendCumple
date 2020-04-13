'use strict'

var path = require('path');
var fs = require('fs');
var mongoosePaginate = require('mongoose-pagination');
var moment = require('moment');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');

function savePublication(req,res){
	var user_id = req.user.sub;
	var params = req.body;
	var publication = new Publication();
	if(!params.text) return res.status(200).send({message:'Tu publicacion deberia tener un texto'});

	publication.text = params.text;
	publication.file = null;
	publication.user = user_id;
	publication.created_at = moment().unix();

	publication.save((err,publicationStored)=>{
		if(err) return res.status(500).send({message:'error al guardar la publicacion'});
		if(!publicationStored) return res.status(404).send({message:'no se pudo guardar la publicacion'});

		return res.status(200).send({message:'publicacion guardada con exito',publication:publicationStored});
	});
}
function getPublicationsUser(req,res){

	var page=1;
	var id = req.params.id;
	console.log(id);
	if(req.params.page) page = req.params.id;

	var itemsPerPage = 5;

	Publication.find({user:id}).sort({'created_at':-1}).paginate(page,itemsPerPage,(err,publications,total)=>{
		if(err) return res.status(500).send({message:'error',err});
		if(!publications){ 
			return res.status(404).send({message:'No hay Publicaciones'});
		}
	return res.status(200).send({total,publications,pages:Math.ceil(total/itemsPerPage),page,itemsPerPage});	});
}
function getPublications(req,res){

	var page=1;
	if(req.params.page) page = req.params.page;

	var itemsPerPage = 5;

	Follow.find({user:req.user.sub}).populate('followed').exec((err,follows)=>{
		if(err) return res.status(500).send({message:'error al guardar la publicacion'});
		if(!follows){ 
			 return res.status(404).send({message:'Aun no sigues a nadie'});
			/*getPublications().then((value)=>{
			return res.status(200).send({message:"Publicaciones mas recientes",publications:value});
		});*/
		}
		var follows_clean = [];
		follows.forEach((follow)=>{
			follows_clean.push(follow.followed);
		});
		follows_clean.push(req.user.sub);
		Publication.find({user: {"$in":follows_clean}}).sort({'created_at':-1}).populate('user').paginate(page,itemsPerPage,(err,publications,total)=>{
			if(err) return res.status(500).send({message:'error al guardar la publicacion'});
			if(!publications){ 
				 return res.status(404).send({message:'No hay Publicaciones'});
				/*getPublications().then((value)=>{
					return res.status(404).send({message:"Los que sigues no han publicado nada, aqui tienes las publicaciones mas recientes",publications:value});
				});*/
			}
			return res.status(200).send({total,publications,pages:Math.ceil(total/itemsPerPage),page,itemsPerPage});
		});
	});
}

function getPublication(req,res){
	console.log(req.params.id);
	var publication_id = req.params.id;
	Publication.findById(publication_id,(err,publication)=>{
		if(err) return res.status(500).send({message:'error al guardar la publicacion'});
		if(!publication) return res.status(404).send({message:'No hay Publicaciones'});

		return res.status(200).send({publication});
	});
}
async function getAllPulication(){
	var publications = await Publication.find().sort('created_at').exec().then((value)=>{
		return value;
	}).cath((err)=>{
		return handleError(err);
	});
	return Publications;
}
function deletePublication(req,res){
	var publicationId = req.params.id;
	var user_id = req.user.sub;

	Publication.find({'_id':publicationId,'user':user_id}).deleteOne((err)=>{
		if(err) res.status(500).send({message:'no se pudo borrar la publicacion'});
		return res.status(200).send({message:'Borrado con exito'});
	});
}
function uploadImage(req,res){
	var publication_id = req.params.id;

	if(req.files){
		var file_path = req.files.image.path;
		var file_split = file_path.split('\\');
		var file_split = file_split[2];
		var file_split = file_split.split('\.');
		var file_name = file_split[0];
		var file_ext = file_split[1];
		if(file_ext == 'png' || file_ext=='jpg' || file_ext=='jpeg' || file_ext=='gif'){
			Publication.findOne({'_id':publication_id,'user':user_id}).exec((err,publication)=>{
				if(err) res.status(500).send({message:'no se pudo encontrar la publicacion'});
				if(publication){
					Publication.findByIdAndUpdate(publication_id,{file:file_name+'.'+file_ext},{new:true},(err,userUpdated)=>{
						if(err) return res.status(500).send({message:"Error en la peticion",err});
				
						if(!userUpdated) return res.status(404).send({message:"No se encuetra el Usuario"});

					
						return res.status(200).send({publication:userUpdated});
					});
				}else{
					return res.status(200).send({message:'Esta publicacion no es tuya'});
				}
			});
			
		}else{
			fs.unlink(file_path,(err)=>{
				return res.status(200).send({message:'Le extencion no es valida'});
			});
		}
	}else{
		return res.status(200).send({message:'no se ha subido la imagen'});
	}
}

function getImageFile(req,res){
	
	
	if(req.params.imageFile){
		var path_file = './uploads/publications/'+req.params.imageFile;
	
	}else{
		return res.status(404).send({message:"Sin Publicacion"});
	}

	fs.exists(path_file,(exists)=>{
		if(exists){
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(404).send({message:"la imagen no existe",path_file});
		}
	});
}

module.exports = {
	savePublication,
	getPublications,
	getPublication,
	deletePublication,
	uploadImage,
	getImageFile,
	getPublicationsUser
}