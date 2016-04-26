//Dependencies

import "bootstrap-loader";
import ReactDom from 'react-dom';
import GravityUI from "./components/GravityUI";

var canvas;

//Events
$(document).ready(() => {
	
	canvas = $('canvas')[0];
	let ui = $('#ui')[0];

	$(window).trigger("resize");

	ReactDom.render(<GravityUI canvas={canvas} />, ui)
});

$(window).on("resize", ()=> {
	if (canvas == null)
		return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
