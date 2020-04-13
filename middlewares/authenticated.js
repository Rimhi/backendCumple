'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');

var secret = "mi_clave_secreta_es_karen";

exports.ensureAuth = function(req,res,next){

	if(!req.headers.authorization){
		return res.status(402).send({message:'La peticion no contiene la cabecera de autenticacion'});

	}

	var token = req.headers.authorization.replace(/['"]+/g,'');
	var payload = null;
	try{
		var payload = jwt.decode(token,secret);
		if(payload.exp <= moment().unix()){
			return res.status(401).send({message:'La session ha expirado vuelve a ingresar',cambiartoken:true});
		}
	}catch(ex){
		return res.status(404).send({message:'Inicia session nuevamente',cambiartoken:true});
	}

	req.user = payload;
	
	next();
}