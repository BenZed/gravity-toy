require "bootstrap-loader"
ReactDom = require "react-dom"
GravityUI = require "./components/GravityUI"

canvas = null

$(document).ready ->
  canvas = $('canvas')[0]
  ui = $('#ui')[0]

  $(window).trigger "resize"

  ReactDom.render <GravityUI canvas={canvas} />, ui

$(window).on "resize", ->
  return if !canvas?

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight