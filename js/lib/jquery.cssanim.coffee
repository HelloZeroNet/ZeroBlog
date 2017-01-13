jQuery.fn.cssSlideDown = ->
	elem = @
	elem.css({"opacity": 0, "margin-bottom": 0, "margin-top": 0, "padding-bottom": 0, "padding-top": 0, "display": "none", "transform": "scale(0.8)"})
	setTimeout (->
		elem.css("display", "")
		height = elem.outerHeight()
		elem.css({"height": 0, "display": ""}).cssLater("transition", "all 0.3s ease-out", 20)
		elem.cssLater({"height": height, "opacity": 1, "margin-bottom": "", "margin-top": "", "padding-bottom": "", "padding-top": "", "transform": "scale(1)"}, null, 40)
		elem.cssLater({"transition": "", "transform": ""}, null, 1000, "noclear")
	), 10
	return @


jQuery.fn.fancySlideDown = ->
	elem = @
	elem.css({"opacity": 0, "transform":"scale(0.9)"}).slideDown().animate({"opacity": 1, "scale": 1}, {"duration": 600, "queue": false, "easing": "easeOutBack"})


jQuery.fn.fancySlideUp = ->
	elem = @
	elem.delay(600).slideUp(600).animate({"opacity": 0, "scale": 0.9}, {"duration": 600, "queue": false, "easing": "easeOutQuad"})
