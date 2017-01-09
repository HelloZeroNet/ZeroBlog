class InlineEditor
	constructor: (@elem, @getContent, @saveContent, @getObject) ->
		@edit_button = $("<a href='#Edit' class='editable-edit icon-edit'></a>")
		@edit_button.on "click", @startEdit
		@elem.addClass("editable").before(@edit_button)
		@editor = null
		@elem.on "mouseenter click", (e) =>
			@edit_button.css("opacity", "0.4")
			# Keep in display
			scrolltop = $(window).scrollTop()
			top = @edit_button.offset().top-parseInt(@edit_button.css("margin-top"))
			if scrolltop > top
				@edit_button.css("margin-top", scrolltop-top+e.clientY-20)
			else
				@edit_button.css("margin-top", "")
		@elem.on "mouseleave", =>
			@edit_button.css("opacity", "")

		if @elem.is(":hover") then @elem.trigger "mouseenter"


	startEdit: =>
		@content_before = @elem.html() # Save current to restore on cancel

		if @elem.data("editable-mode") == "meditor"
			@editor = new Meditor(@elem[0], @getContent(@elem, "raw"))
			@editor.handleImageSave = @handleImageSave
			@editor.load()
		else
			@editor = $("<textarea class='editor'></textarea>")
			@editor.val @getContent(@elem, "raw")
			@elem.after(@editor)

			@elem.html [1..50].join("fill the width") # To make sure we span the editor as far as we can
			@copyStyle(@elem, @editor) # Copy elem style to editor
			@elem.html @content_before # Restore content


			@autoExpand(@editor) # Set editor to autoexpand
			@elem.css("display", "none") # Hide elem

			if $(window).scrollTop() == 0 # Focus textfield if scroll on top
				@editor[0].selectionEnd = 0
				@editor.focus()

		$(".editbg").css("display", "block").cssLater("opacity", 0.9, 10)
		$(".editable-edit").css("display", "none") # Hide all edit button until its not finished

		$(".editbar").css("display", "inline-block").addClassLater("visible", 10)
		$(".publishbar").css("opacity", 0) # Hide publishbar
		$(".editbar .object").text @getObject(@elem).data("object")+"."+@elem.data("editable")
		$(".editbar .button").removeClass("loading")

		$(".editbar .save").off("click").on "click", @saveEdit
		$(".editbar .delete").off("click").on "click", @deleteObject
		$(".editbar .cancel").off("click").on "click", @cancelEdit

		# Deletable button show/hide
		if @getObject(@elem).data("deletable")
			$(".editbar .delete").css("display", "").html("Delete "+@getObject(@elem).data("object").split(":")[0])
		else
			$(".editbar .delete").css("display", "none")

		window.onbeforeunload = ->
			return 'Your unsaved blog changes will be lost!'

		return false

	handleImageSave: (name, image_base64uri, el) =>
		el.style.opacity = 0.5
		object_name = @getObject(@elem).data("object").replace(/[^A-Za-z0-9]/g, "_").toLowerCase()
		file_path = "data/img/#{object_name}_#{name}"
		Page.cmd "fileWrite", [file_path, image_base64uri.replace(/.*,/, "")], =>
			el.style.opacity = 1
			el.src = file_path

	stopEdit: =>
		@editor.remove()
		@editor = null
		@elem.css("display", "").css("z-index", 999).css("position", "relative").cssLater("z-index", "").cssLater("position", "")
		$(".editbg").css("opacity", 0).cssLater("display", "none")

		$(".editable-edit").css("display", "") # Show edit buttons

		$(".editbar").cssLater("display", "none", 1000).removeClass("visible") # Hide editbar
		$(".publishbar").css("opacity", 1) # Show publishbar

		window.onbeforeunload = null


	saveEdit: =>
		content = @editor.val()
		$(".editbar .save").addClass("loading")
		@saveContent @elem, content, (content_html) =>
			if content_html # File write ok
				$(".editbar .save").removeClass("loading")
				@stopEdit()
				if typeof content_html == "string" # Returned the new content
					@elem.html content_html

				$('pre code').each (i, block) -> # Higlight code blocks
					hljs.highlightBlock(block)

				Page.addImageZoom(@elem)
			else
				$(".editbar .save").removeClass("loading")

		return false


	deleteObject: =>
		object_type = @getObject(@elem).data("object").split(":")[0]
		Page.cmd "wrapperConfirm", ["Are you sure you sure to delete this #{object_type}?", "Delete"], (confirmed) =>
			$(".editbar .delete").addClass("loading")
			Page.saveContent @getObject(@elem), null, =>
				@stopEdit()
		return false


	cancelEdit: =>
		@stopEdit()
		@elem.html @content_before

		$('pre code').each (i, block) -> # Higlight code blocks
			hljs.highlightBlock(block)

		Page.cleanupImages()

		return false


	copyStyle: (elem_from, elem_to) ->
		elem_to.addClass(elem_from[0].className)
		from_style = getComputedStyle(elem_from[0])

		elem_to.css
			fontFamily: 	from_style.fontFamily
			fontSize: 		from_style.fontSize
			fontWeight: 	from_style.fontWeight
			marginTop: 		from_style.marginTop
			marginRight: 	from_style.marginRight
			marginBottom: 	from_style.marginBottom
			marginLeft: 	from_style.marginLeft
			paddingTop: 	from_style.paddingTop
			paddingRight: 	from_style.paddingRight
			paddingBottom: 	from_style.paddingBottom
			paddingLeft: 	from_style.paddingLeft
			lineHeight: 	from_style.lineHeight
			textAlign: 		from_style.textAlign
			color: 			from_style.color
			letterSpacing: 	from_style.letterSpacing

		if elem_from.innerWidth() < 1000 # inline elems fix
			elem_to.css "minWidth", elem_from.innerWidth()


	autoExpand: (elem) ->
		editor = elem[0]
		# Autoexpand
		elem.height(1)
		elem.on "input", ->
			if editor.scrollHeight > elem.height()
				elem.height(1).height(editor.scrollHeight + parseFloat(elem.css("borderTopWidth")) + parseFloat(elem.css("borderBottomWidth")))
		elem.trigger "input"

		# Tab key support
		elem.on 'keydown', (e) ->
			if e.which == 9
				e.preventDefault()
				s = this.selectionStart
				val = elem.val()
				elem.val(val.substring(0,this.selectionStart) + "\t" + val.substring(this.selectionEnd))
				this.selectionEnd = s+1;


window.InlineEditor = InlineEditor