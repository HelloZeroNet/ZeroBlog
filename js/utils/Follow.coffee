class Follow extends Class
	constructor: (@elem) ->
		@menu = new Menu("Follow", -> {
			top: $(".feed-follow").offset().top + $(".feed-follow").outerHeight() + "px",
			left: $(".feed-follow").offset().left + $(".feed-follow").outerWidth() - $("[menu_id='Follow']").outerWidth() + "px"
		})
		@feeds = {}
		@follows = {}
		@elem.on "click", =>
			if Page.server_info.rev > 850
				if @elem.hasClass "following"
					@menu.show()
				else
					@followDefaultFeeds()
					for title, [query, item_num, is_default_feed, param] of @feeds
						if not @menu.items[item_num].selected
							@menu.show()
							break
			else
				Page.cmd "wrapperNotification", ["info", "Please update your ZeroNet client to use this feature"]
			return false

	init: =>
		if not @feeds
			return
		Page.cmd "feedListFollow", [], (@follows) =>
			for title, [query, item_num, is_default_feed, param] of @feeds
				if @follows[title] and param in @follows[title][1]
					@menu.items[item_num].selected = 1
				else
					@menu.items[item_num].selected = 0
			@updateListitems()
			@elem.css "display", "inline-block"

	addFeed: (title, query, is_default_feed=false, param="") ->
		item_num = @menu.addItem(title, @handleMenuClick)
		@feeds[title] = [query, item_num, is_default_feed, param]

	handleMenuClick: (evt) =>
		@menu.items[evt.target.item_num].selected ^= 1
		@updateListitems()
		@saveFeeds()

	followDefaultFeeds: ->
		for title, [query, item_num, is_default_feed, param] of @feeds
			if is_default_feed
				@menu.items[item_num].selected = 1
				@log "Following", title
		@updateListitems()
		@saveFeeds()

	updateListitems: ->
		selected_num = 0
		for item in @menu.items
			selected_num += 1 if item.selected
		if selected_num  > 0
			@elem.addClass "following"
		else
			@elem.removeClass "following"

	saveFeeds: ->
		Page.cmd "feedListFollow", [], (follows) =>
			@follows = follows
			for title, [query, item_num, is_default_feed, param] of @feeds
				if follows[title]
					params = (item for item in follows[title][1] when item != param)  # Remove current param from follow list
				else
					params = []

				if @menu.items[item_num].selected  # Add if selected
					params.push(param)

				if params.length == 0   # Empty params
					delete follows[title]
				else
					follows[title] = [query, params]

			Page.cmd "feedFollow", [follows]

window.Follow = Follow