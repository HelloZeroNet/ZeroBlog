class Time
	since: (time) ->
		return moment(time,'X').fromNow()


	date: (timestamp, format="short") ->
		return moment(timestamp,'X').format(if format=="short" then "ll" else if format=="ultra" then "YYYY-MM-DD HH:mm:ss" else "lll")


	timestamp: (date="") ->
		if date == "now" or date == ""
			return moment()
		else
			return moment(date)


	# Get elistamated read time for post
	readtime: (text) ->
		chars = text.length
		if chars > 1500
			return parseInt(chars/1500)+" min read"
		else
			return "less than 1 min read"


window.Time = new Time