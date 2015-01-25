class InlineEditor
	constructor: (@elem, @getContent, @saveContent, @getObject) ->
		@edit_button = $("<a href='#Edit' class='editable-edit'>§</a>")
		@edit_button.on "click", @startEdit
		@elem.addClass("editable").before(@edit_button)
		@elem.on "mouseenter", (e) =>
			@edit_button.css("opacity", "1")
		@elem.on "mouseenter contextmenu", (e) =>
			# Keep in display
			scrolltop = $(window).scrollTop()
			top = @edit_button.offset().top-parseInt(@edit_button.css("margin-top"))
			if scrolltop > top
				@edit_button.css("margin-top", scrolltop-top+e.clientY-20)
			else
				@edit_button.css("margin-top", "")
		@elem.on "mouseleave", =>
			@edit_button.css("opacity", "")


	startEdit: =>
		@elem.attr("contenteditable", "true")
		@content_before = @elem.html() # Save current to restore on cancel
		@elem.html @markdownToEditable(@getContent(@elem, true)) # Convert to html
		@elem.css("outline", "10000px solid rgba(255,255,255,0)").cssLater("transition", "outline 0.3s", 5).addClassLater("editing",10) # Animate other elements fadeout
		if $(window).scrollTop() == 0 then @elem.focus()
		@elem.on "paste", => # Fix for html formatted paste
			setTimeout (=>
				fixed = @markdownToEditable(@editableToMarkdown( @elem.html() ))
				if fixed != @elem.html()
					@elem.html(fixed)
			), 0

		$(".editable-edit").css("display", "none") # Hide all edit button until its not finished

		$(".editbar").css("display", "inline-block").addClassLater("visible", 10) 
		$(".publishbar").css("opacity", 0) # Hide publishbar
		$(".editbar .object").text @getObject(@elem).data("object")+"."+@elem.data("editable")
		$(".editbar .button").removeClass("loading")

		$(".editbar .save").off("click").on "click", @saveEdit
		$(".editbar .delete").off("click").on "click", @deletePost
		$(".editbar .cancel").off("click").on "click", @cancelEdit

		# Deletable button show/hide
		if @getObject(@elem).data("deletable")
			$(".editbar .delete").css("display", "").html("Delete "+@getObject(@elem).data("object").split(":")[0])
		else
			$(".editbar .delete").css("display", "none")


		### Tab fix (not works with contenteditable)
		@elem.on 'keydown', (e) =>
			if e.which == 9 # Tab fix
				e.preventDefault();
				s = @elem.selectionStart;
				val = @elem.html()
				debugger
				@elem.html val.substring(0,@elem[0].selectionStart) + "\t" + val.substring(@elem[0].selectionEnd)
				@elem[0].selectionEnd = s+1; 
		###
		
		return false


	stopEdit: =>
		$(".editable-edit").css("display", "")
		@elem.attr("contenteditable", "false")
		@elem.removeClass("editing")
		@elem.off "blur"

		$(".editbar").cssLater("display", "none", 1000).removeClass("visible") # Hide editbar
		$(".publishbar").css("opacity", 1) # Show publishbar


	saveEdit: =>
		content = @editableToMarkdown(@elem.html())
		$(".editbar .save").addClass("loading")
		@saveContent @elem, content, (content_html) =>
			if content_html # File write ok
				$(".editbar .save").removeClass("loading")
				@stopEdit()
				@elem.html content_html

				$('pre code').each (i, block) -> # Higlight code blocks
					hljs.highlightBlock(block)
			else
				$(".editbar .save").removeClass("loading")

		return false


	deletePost: =>
		object_type = @getObject(@elem).data("object").split(":")[0]
		window.zero_blog.cmd "wrapperConfirm", ["Are you sure you sure to delete this #{object_type}?", "Delete"], (confirmed) => 
			@stopEdit()
			@saveContent @getObject(@elem), null
		return false


	cancelEdit: =>
		@stopEdit()
		@elem.html @content_before

		$('pre code').each (i, block) -> # Higlight code blocks
			hljs.highlightBlock(block)

		return false


	editableToMarkdown: (s) ->
		s = s.replace(/<br><\/p>/g, "\n").replace(/<\/p>/g,"\n")# Convert newlines IE
		s = s.replace(/<br><\/div>/g, "\n").replace(/<div>/g,"\n").replace(/<br.*?>/g, "\n")# Convert newlines
		s = $("<div>"+s+"</div>").text() # Convert to text
		return s


	markdownToEditable: (s) ->
		return s.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")

 
window.InlineEditor = InlineEditor