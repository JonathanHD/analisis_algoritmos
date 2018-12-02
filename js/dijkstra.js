// Muestra oculta el contenido
var show = true;
/*Ajustes de los frames en los navegadores, esto para la velocidad que tornará el efecto en el programa*/
(function () {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
	} // end for

	if (!window.requestAnimationFrame) window.requestAnimationFrame = function (callback, element) {
		var currTime = new Date().getTime();
		var timeToCall = Math.max(0, 16 - (currTime - lastTime));
		var id = window.setTimeout(function () {
			callback(currTime + timeToCall);
		},
		timeToCall);
		lastTime = currTime + timeToCall;
		return id;
	};

	if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id) {
		clearTimeout(id);
	};
}());

var entrada =  '', canvas = '', context = '';

let nodos = [];
var t, puntos;

/*
	Función llamada para recibir entradas, no retorna ningún valor y su principal objetivo es notificar si hay un error y para el procesos de lo
	contrario su función es únicamente validar y preparar para el proceso principal el json.
*/
function enviar() {

	// Para redibujar
	canvas = document.getElementById('canvas');
	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;
	canvasW = canvas.width;
	canvasH = canvas.height;

	context = canvas.getContext('2d');
	context.clearRect(0, 0, canvasW, canvasH);
	
	puntos = [];
	t = 1;

	// Entrada json
	entrada = document.getElementById("array");
	
	let banderaIni = false, banderaFin = false;
	try {
		var json = JSON.parse( entrada.value );
		// Colocar inicio y Final
		let ini = document.getElementById( "inicio" ).value, fin =  document.getElementById( "fin" ).value;
		if( ini && fin )
			json.forEach( function( item, index ) {
				switch( item.nombre ) {
					case ini:
						json[ index ].inicio = true;
						banderaIni = true;
					break;
					case fin:
						json[ index ].final = true;
						banderaFin = true;
					break;
				} // end switch

			});
			
		// Si especificaron una entrada de nodo de inicio y de fin correcta
		if( banderaFin && banderaIni ) {
			showHide();
			procesoPrincipal( json );
		} // end if
		else
			alert( "No haz colocado un nodo de inicio o final válido" );

	} catch(e) {
		console.log( "Hay un problema con la captura de datos" );
		alert( 'Corrige tu objeto json' );
	} // end catch

} // end enviar

/*
	Función principal, esta función se encarga de dibujar los nodo y las aristas procesando los nodos que el usuario ingresó aparte manda a llamar a 
	la función dijkstra que se encarga de encontrar el camino más optimo a un nodo, también se encarga de animar dicho camino.
	No retorna valores.
*/
function procesoPrincipal( arr ) {


	let radio = 50;
	let distanciaX = 250;

	// x, y nodos
	let x = distanciaX;
	let y = 93;

	//Dibujar nodos
	arr.forEach( function( item, index ) {
		let distanciaY = separacionY( canvasH, 3 );
		nodos[ index ] = item;

		let nodo = new Nodo( context, 0, 0, 50, item.nombre );
		if( index == 0 ) {
			nodo.setxy( 75, (canvasH/2) - radio );
			nodos[index].x = 75;
			nodos[index].y = (canvasH/2) - radio;
			} // end if
			else {
				nodo.setxy( x, y );
				nodos[index].x = x;
				nodos[index].y = y;
				// Cada tres nodo vuelve a comenzar
				if( index % 3 == 0 ) {
					x += 300;
					y = 90;
				} // end if
				else
					y += distanciaY;

			} // end else
			nodo.dibujar();
	} );

	//Dibujar aristas
	arr.forEach( function( item, index ) {

		item['enlaces'].forEach( function( enlace, index1 ) {
			context.beginPath();

			if( Math.abs(enlace.id - item.id) == 2 ) {
				context.moveTo( item.x + radio, item.y );
				context.lineTo( nodos[ enlace.id ].x - radio,  nodos[ enlace.id ].y );
			} // end if
			else if( Math.abs(enlace.id - item.id) == 1 ) {
				// si comienza por arriba del nodo y termina abajo del destino
				context.moveTo( item.x, item.y - radio );
				if( index  == 0 )
					context.lineTo( nodos[ enlace.id ].x - radio,  nodos[ enlace.id ].y );
				else
					context.lineTo( nodos[ enlace.id ].x,  nodos[ enlace.id ].y + radio );

			} // else if

			else if( Math.abs(enlace.id - item.id) >=  3 ) {
				// comienza arista por abajo y llega a la izquierda
				if( index  == 0 )
					context.moveTo( item.x, item.y + radio );
				else
					context.moveTo( item.x + radio, item.y );

				context.lineTo( nodos[ enlace.id ].x - radio,  nodos[ enlace.id ].y );
			} // end if


			context.strokeStyle = 'orange';
			context.stroke();
			context.fillStyle = '#42ff00';
			context.textAlign = 'center';
			let xm = (nodos[ enlace.id ].x+item.x) / 2;
			let ym = (nodos[ enlace.id ].y+item.y) / 2;
			context.fillText( enlace.coste, xm, ym);

			// throw BreakException;
		}); // end foreach
	} );

	let grafo = {}, inicio = 0, fin = 0;

	// Preparando grafo para algoritmo
	nodos.forEach( function( item, index ) {
		let enlaces = {};
		if( nodos[ item.id ].final )
			fin = { x: nodos[ item.id ].x, y: nodos[ item.id ].y };
		else if( nodos[ item.id ].inicio )
			inicio = { x: nodos[ item.id ].x, y: nodos[ item.id ].y };
		item['enlaces'].forEach( function( items, index1 ) {
			if( nodos[ items.id ].final )
				enlaces[ 'final' ] = items.coste;
			else
				enlaces[ nodos[ items.id ].nombre ] = items.coste;
		});

		if( item.inicio )
			grafo['inicio'] = enlaces;
		else if( item.final )
			grafo['final'] = enlaces;
		else
			grafo[item.nombre] = enlaces;

	} );

	let optimo = dijkstra(grafo);


	let vertices = [];
	vertices.push(inicio);
	optimo.path.shift();
	optimo.path.pop();
	optimo.path.forEach( function( item, index ) {
		nodos.forEach( function( nodo, index1 ) {
			if( item !== 'final' && item !== 'inicio' && item == nodo.nombre )
				vertices.push( { x: nodo.x, y: nodo.y } );
		} );
	} );
	
	vertices.push(fin);

	dibujarOptimo( vertices );

} // end procesoPrincipal


/*El objetivo de esta función es prepara los puntos para animar el trazo de la ruta más optima
No retorna valores*/
function dibujarOptimo( vertices ) {

	context.lineCap = "round";

	context.lineWidth = 5;
	context.strokeStyle = "blue";
	// Calcular los puntos para 'animar'
	puntos = calcularPuntosParaAnimacion(vertices);

	// dibujar los puntos extendidos
	animate(puntos);
} // end dinujarOptimo

/*Esta función tiene como objetivo dividir el segmento de recta en 100 pedazos para dar el efecto animado al trazo
No retorna valores*/
function calcularPuntosParaAnimacion(vertices) {
	var waypuntos = [];
	for (var i = 1; i < vertices.length; i++) {
		var pt0 = vertices[i - 1];
		var pt1 = vertices[i];
		var dx = pt1.x - pt0.x;
		var dy = pt1.y - pt0.y;
		for (var j = 0; j < 100; j++) {
			var x = pt0.x + dx * j / 100;
			var y = pt0.y + dy * j / 100;
			waypuntos.push({
				x: x,
				y: y
			});
		}
	}
	return (waypuntos);
}

/*Esta función tiene como objetivo mandarse a llamar a sí misma (Recursiva) la cantidad de trozos que tiene el arreglo puntos*/
function animate() {
	if (t < (puntos.length - 1) )
		requestAnimationFrame(animate);

	context.beginPath();
	context.moveTo(puntos[t - 1].x, puntos[t - 1].y);
	context.lineTo(puntos[t].x, puntos[t].y);
	context.stroke();
	t++;
} // end animate


/*Esta función tiene como objetivo calcular el camino más optimo de los nodos seleccionados*/
function dijkstra( grafo ) {

	const costes = Object.assign({final: Infinity}, grafo.inicio);

	const padres = {final: null};
	
	for (let hijo in grafo.inicio)
		padres[hijo] = 'inicio';

	const procesados = [];

	let node = nodoMenorCosto(costes, procesados);

	while (node) {
		// console.log(`***** 'nodo Actual': ${node} *****`)
		let costToReachNode = costes[node];
		let hijoNodo = grafo[node];

		for (let hijo in hijoNodo) {
			let costFromNodetohijo = hijoNodo[hijo]
			let nuevoCosto = costToReachNode + costFromNodetohijo;

			if (!costes[hijo] || costes[hijo] > nuevoCosto) {
				costes[hijo] = nuevoCosto;
				padres[hijo] = node;
			} // end if

		} // end for

		procesados.push(node);

		node = nodoMenorCosto(costes, procesados);
	} // end while

	let rutaOptima = ['final'];
	let padre = padres.final;
	while (padre) {
		rutaOptima.push(padre);
		padre = padres[padre];
	}
	rutaOptima.reverse();

	let results = {
		distance: costes.final,
		path: rutaOptima
	};


	return results;
}; // end dijkstra

/*Está función actualiza la lista (array de objetos) de nodos procesados, regresa el nodo con costo menor*/
function nodoMenorCosto(costos, procesados) {
	return Object.keys(costos).reduce( function(menor, nodo) {
		if ( (menor === null || costos[nodo] < costos[menor]) && !procesados.includes(nodo))
			menor = nodo;
		return menor;
	}, null);
};

/*Esta función retorna la distancia que deben estar separados los enlaces, recibe:
alto de la pantalla
numero de enlaces del nodo*/
function separacionY( alto, enlaces ) {
	return (alto/enlaces);
} // end separacionY

/*Esta función tiene como objetivo mostrar y ocultar el panel
no devuelve valores*/
function showHide() {
	let contenido = document.getElementById("showContent");
	let panel = document.getElementById("panel");

	if( show ) {
		contenido.innerHTML = ("<-");
		panel.style.display = "none";
	} // end if
	else {
		panel.style.display = "block";
		contenido.innerHTML = ("->");
	} // end else

	show = !show;
} // end showHide

/*La clase nodo nos sirve para pintar los nodos, tiene como variables de instancia:
Color, x, y, radio, color, nombre  y fuente */

class Nodo {
	// let x, y, ctx, radio, nombre, color, tam, font;
	constructor( ctx, x = 0, y = 0, radio = 50, nombre = 'A', color = '#fff', tam = '25px', font = 'Arial' ) {
		this.ctx = ctx;
		this.x = x;
		this.y = y;
		this.nombre = nombre;
		this.radio = radio;
		this.color = color;
		this.tam = tam;
		this.font = font;
		// console.log( nombre )
	} // end construct	

	setxy( x, y ){
		this.x = x;
		this.y = y;
	}

	dibujar( ) {
		context.strokeStyle = '#fff';
		context.lineWidth = 1;
		context.beginPath();
		context.arc(this.x, this.y, this.radio, 0, 2*Math.PI);
		context.stroke();
		context.font= `${this.tam} ${this.font}`;
		context.fillStyle = 'white';
		context.textAlign = 'center';
		context.fillText( this.nombre, this.x, this.y+6);
	} // end dibujar

	getMousePos( canvas, evt ) {
		var rect = canvas.getBoundingClientRect();
		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		};
	} // end gerMousePos

} // end class Nodo

/*Efecto al cargar*/
window.addEventListener( 'load', function(){
	document.getElementById("spinLoad").className += ' animar';
	setTimeout( function(){
		document.getElementById("body").className = 'loaded';
	}, 350 );
} );