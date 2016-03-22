class Menu
	constructor: (menu_id, offset) ->
		@menu_id = menu_id
		@offset = offset
		@items = []
		Page.projector.append(document.body, @render)

	render: =>
		h("div.menu", {menu_id: @menu_id, classes: {visible: window.visible_menu == @}, styles: {top: @offset().top, left: @offset().left}},
			@items.map((value, index) => h("a.menu-item", {
				key: index,
				item_num: index,
				classes: {selected: value.selected},
				onclick: value.cb
			}, value.title))
		)

	show: =>
		window.visible_menu = @
		Page.projector.scheduleRender()

	hide: =>
		if window.visible_menu == @
			window.visible_menu = null
		Page.projector.scheduleRender()

	addItem: (title, cb) =>
		item = {title: title, cb: cb}
		@items.push item
		Page.projector.scheduleRender()
		@items.length - 1

	log: (args...) ->
		console.log "[Menu]", args...

window.Menu = Menu

# Hide menu on outside click
$("body").on "click", (e) ->
	if e.target != $(".menu.visible") and window.visible_menu
		window.visible_menu.hide()