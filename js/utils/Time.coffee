class Time
	since: (time) ->
		now = +(new Date)/1000
		secs = now - time
		if secs < 60
			back = "Just now"
		else if secs < 60*60
			back = "#{Math.round(secs/60)} minutes ago"
		else if secs < 60*60*24
			back = "#{Math.round(secs/60/60)} hours ago"
		else if secs < 60*60*24*3
			back = "#{Math.round(secs/60/60/24)} days ago"
		else
			back = "on "+@date(time)
		back = back.replace(/1 ([a-z]+)s/, "1 $1") # 1 days ago fix
		return back


	date: (timestamp, format="short") ->
		parts = (new Date(timestamp*1000)).toString().split(" ")
		if format == "short"
			display = parts.slice(1, 4)
		else
			display = parts.slice(1, 5)
		return display.join(" ").replace(/( [0-9]{4})/, ",$1")


	timestamp: (date="") ->
		if date == "now" or date == ""
			return parseInt(+(new Date)/1000)
		else
			return parseInt(Date.parse(date)/1000)


	# Get elistamated read time for post
	readtime: (text) ->
		chars = text.length
		if chars > 1500
			return parseInt(chars/1500)+" min read"
		else
			return "less than 1 min read"


window.Time = new Time