class Follow extends Class
	constructor: (@elem) ->
		@menu = new Menu(@elem)
		@feeds = {}
		@follows = {}
		@elem.off "click"
		@elem.on "click", =>
			if Page.server_info.rev > 850
				if @elem.hasClass "following"
					@showFeeds()
				else
					@followDefaultFeeds()
					for title, [query, menu_item, is_default_feed, param] of @feeds
						if not menu_item.hasClass "selected"
							@showFeeds()
							break
			else
				Page.cmd "wrapperNotification", ["info", "Please update your ZeroNet client to use this feature"]
			return false

	init: =>
		if not @feeds
			return
		Page.cmd "feedListFollow", [], (@follows) =>
			for title, [query, menu_item, is_default_feed, param] of @feeds
				if @follows[title] and param in @follows[title][1]
					menu_item.addClass("selected")
				else
					menu_item.removeClass("selected")
			@updateListitems()
			@elem.css "display", "inline-block"

		setTimeout ( =>
			if typeof(Page.site_info.feed_follow_num) != "undefined" and Page.site_info.feed_follow_num == null  # Has not manipulated followings yet
				@followDefaultFeeds()
		), 100


	addFeed: (title, query, is_default_feed=false, param="") ->
		menu_item = @menu.addItem title, @handleMenuClick
		@feeds[title] = [query, menu_item, is_default_feed, param]


	handleMenuClick: (item) =>
		item.toggleClass("selected")
		@updateListitems()
		@saveFeeds()
		return true


	showFeeds: ->
		@menu.show()


	followDefaultFeeds: ->
		for title, [query, menu_item, is_default_feed, param] of @feeds
			if is_default_feed
				menu_item.addClass "selected"
				@log "Following", title, menu_item
		@updateListitems()
		@saveFeeds()


	updateListitems: ->
		if @menu.elem.find(".selected").length > 0
			@elem.addClass "following"
		else
			@elem.removeClass "following"


	saveFeeds: ->
		Page.cmd "feedListFollow", [], (follows) =>
			@follows = follows
			for title, [query, menu_item, is_default_feed, param] of @feeds
				if follows[title]
					params = (item for item in follows[title][1] when item != param)  # Remove current param from follow list
				else
					params = []

				if menu_item.hasClass "selected"  # Add if selected
					params.push(param)

				if params.length == 0   # Empty params
					delete follows[title]
				else
					follows[title] = [query, params]

			Page.cmd "feedFollow", [follows]


window.Follow = Follow