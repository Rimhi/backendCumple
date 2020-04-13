'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;

mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/redsocial',{ useNewUrlParser:true, useUnifiedTopology: true }).then(()=>{

	console.log('Conexion establecida con exito');

	//server
	app.listen(port,()=>{
		console.log("servidor corriendo");
	});
}).catch(err => console.log(err));