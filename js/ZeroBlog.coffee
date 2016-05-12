class ZeroBlog extends ZeroFrame
  init: ->
    @data = null
    @site_info = null
    @server_info = null
    @page = 1
    @my_post_votes = {}

    @event_page_load = $.Deferred()
    @event_site_info = $.Deferred()

    # Editable items on own site
    $.when(@event_page_load, @event_site_info).done =>
      if @site_info.settings.own or @data.demo
        @addInlineEditors()
        @checkPublishbar()
        $(".publishbar").off("click").on "click", @publish
        $(".posts .button.new").css("display", "inline-block")
        $(".editbar .icon-help").off("click").on "click", ->
          $(".editbar .markdown-help").css("display", "block")
          $(".editbar .markdown-help").toggleClassLater("visible", 10)
          $(".editbar .icon-help").toggleClass("active")
          return false

    $.when(@event_site_info).done =>
      @log "event site info"
      # Set avatar
      imagedata = new Identicon(@site_info.address, 70).toString()
      $("body").append("<style>.avatar { background-image: \
          url(data:image/png;base64,#{imagedata}) }</style>")
      @initFollowButton()
    @log "inited!"


  initFollowButton: ->
    @follow = new Follow($(".feed-follow"))
    @follow.addFeed("Posts", "
      SELECT
       post_id AS event_uri,
       'post' AS type,
       date_published AS date_added,
       title AS title,
       body AS body,
       '?Post:' || post_id AS url
      FROM post", true)

    if Page.site_info.cert_user_id
      username = Page.site_info.cert_user_id.replace /@.*/, ""
      @follow.addFeed("Username mentions", "
        SELECT
        'comment' AS type,
         date_added,
         post.title AS title,
         keyvalue.value || ': ' || comment.body AS body,
         '?Post:' || comment.post_id || '#Comments' AS url
        FROM comment
        LEFT JOIN json USING (json_id)
        LEFT JOIN json AS json_content ON
        (json_content.directory = json.directory
        AND json_content.file_name='content.json')
        LEFT JOIN keyvalue ON
        (keyvalue.json_id = json_content.json_id AND key = 'cert_user_id')
        LEFT JOIN post ON (comment.post_id = post.post_id)
        WHERE
         comment.body LIKE '%[#{username}%' OR
         comment.body LIKE '%@#{username}%'
      ", true)

    @follow.addFeed("Comments", "
      SELECT
      'comment' AS type,
       date_added,
       post.title AS title,
       keyvalue.value || ': ' || comment.body AS body,
       '?Post:' || comment.post_id || '#Comments' AS url
      FROM comment
      LEFT JOIN json USING (json_id)
      LEFT JOIN json AS json_content ON
      (json_content.directory = json.directory AND
      json_content.file_name='content.json')
      LEFT JOIN keyvalue ON
      (keyvalue.json_id = json_content.json_id AND key = 'cert_user_id')
      LEFT JOIN post ON (comment.post_id = post.post_id)")
    @follow.init()


  loadData: (query="new") ->
    # Get blog parameters
    if query == "old" # Old type query for pre 0.3.0
      query = "SELECT key, value FROM json LEFT JOIN keyvalue USING (json_id)
      WHERE path = 'data.json'"
    else
      query = "SELECT key, value FROM json LEFT JOIN keyvalue USING (json_id)
      WHERE directory = '' AND file_name = 'data.json'"
    @cmd "dbQuery", [query], (res) =>
      @data = {}
      if res
        for row in res
          @data[row.key] = row.value
        $(".left h1 a:not(.editable-edit)").html(@data.title)
            .data("content", @data.title)
        $(".left h2").html(Text.renderMarked(@data.description))
            .data("content", @data.description)
        $(".left .links").html(Text.renderMarked(@data.links))
            .data("content", @data.links)

  loadLastcomments: (type="show", cb=false) ->
    query = "
      SELECT
      comment.*, json_content.json_id AS content_json_id,
      keyvalue.value AS cert_user_id, json.directory, post.title AS post_title
      FROM comment
      LEFT JOIN json USING (json_id)
      LEFT JOIN json AS json_content ON
      (json_content.directory = json.directory AND
      json_content.file_name='content.json')
      LEFT JOIN keyvalue ON
      (keyvalue.json_id = json_content.json_id AND key = 'cert_user_id')
      LEFT JOIN post ON (comment.post_id = post.post_id)
      WHERE post.title IS NOT NULL
      ORDER BY date_added DESC LIMIT 3"

    @cmd "dbQuery", [query], (res) =>
      if res.length
        $(".lastcomments").css("display", "block")
        res.reverse()
      for lastcomment in res
        elem =
            $("#lastcomment_#{lastcomment.json_id}_#{lastcomment.comment_id}")
        if elem.length == 0 # Not exits yet
          elem = $(".lastcomment.template").clone().
          removeClass("template").attr("id",
          "lastcomment_#{lastcomment.json_id}_#{lastcomment.comment_id}")
          if type != "noanim"
            elem.cssSlideDown()
          elem.prependTo(".lastcomments ul")
        @applyLastcommentdata(elem, lastcomment)
      if cb then cb()

  applyLastcommentdata: (elem, lastcomment) ->
    elem.find(".user_name")
        .text(lastcomment.cert_user_id.replace(/@.*/, "")+":")

    body = Text.renderMarked(lastcomment.body)
    body = body.replace /[\r\n]/g, " "  # Remove whitespace
    #Remove quotes
    body = body.replace /\<blockquote\>.*?\<\/blockquote\>/g, " "
    body = body.replace /\<.*?\>/g, " "  # Remove html codes
    if body.length > 60  # Strip if too long
      #Keep the last 60 character and strip back until last space
      body = body[0..60].replace(/(.*) .*?$/, "$1") + " ..."
    elem.find(".body").html(body)

    title_hash = lastcomment.post_title.replace(/[#?& ]/g, "+")
        .replace(/[+]+/g, "+")
    elem.find(".postlink").text(lastcomment.post_title)
        .attr("href", "?Post:#{lastcomment.post_id}:#{title_hash}#Comments")

  applyPagerdata: (page, limit, total) ->
    pager = $(".pager")

    total_page = (total+limit-1)//limit
    if total_page <1
      return

    current_page =pager.find(".currentpage")
    current_page.text(page).css("display","inline-block")
    has_first = 0
    if page > 1
      pager.find(".first").css("display", "inline-block")
      has_first = 1

		
    has_last = 0
    if page != total_page
      pager.find(".last").css("display", "inline-block")
          .attr("href", "?page=#{total_page}")
      has_last = 1

    if total_page<4
      return

    #margin , or number larger
    element_width = current_page.width() + 7
    # how many buttons we can insert ?
    number = pager.width() // element_width - has_first - has_last - 1

    half = number//2
    # exclude left pages
    # but not underflow 1
    left_pages_max = Math.min(page-1,
      #half of insertable, or page near last
      Math.max(half, number-(total_page-page)))

    right_pages_max = Math.min(total_page-page,
      Math.max(half, total_page-page))

    left_pages = 0
    right_pages = 0

    if left_pages_max < half
      left_pages = left_pages_max
      right_pages = Math.min(number - left_pages,right_pages_max)
    else if right_pages_max < half
      right_pages = right_pages_max
      left_pages = Math.min(number - right_pages,left_pages_max)
    else
      left_pages = half
      right_pages = number-half

    i=0

    while i<left_pages
      #this only enter when current page > 1 so first button always show
      n = page - left_pages+i
      current_page.before("<a class='pagershow' href='?page=#{n}'>#{n}</a>")
      ++i

    i=0
    while i<right_pages
      n = page+right_pages-i
      text = n
      if i is 0 && n!=total_page
        text = n+"..."
        
      current_page.after("<a class='pagershow' href='?page=#{n}'>#{text}</a>")
      ++i

  routeUrl: (url) ->
    @log "Routing url:", url
    if match = url.match /Post:([0-9]+)/
      $("body").addClass("page-post")
      @post_id = parseInt(match[1])
      @pagePost()
    else if match = url.match /Toc=(.*)/
      @pageToc(match[1])
    else
      $("body").addClass("page-main")
      if match = url.match /page=([0-9]+)/
        @page = parseInt(match[1])
      @pageMain()

  pageToc:(tocType) ->
    $("body").addClass("page-post")

    if tocType.match /^dateDesc/
      @pageTocDateDesc()
    else if tocType.match /^tagAll/
      @pageTocTagAll()
    else if tocType.match /^tag/
      @pageTocByTag(tocType.split("&")[0].substring(3))

    @pageLoaded()
    #TOC page didn't show details row nor allow edit,comments
    $(".post .details").hide()
    $(".editable-edit").hide()
    Comments.hide()

  emptyTocPage: (title,body) ->
    @applyPostdata($(".post-full"),
       title:title
       post_id:-1
       votes:-1
       comments:-1
       body:body
       ,true)

  pageTocByTag:(tagType) ->
    queryString = ""
    tag =""
    #query untagged
    if tagType.match /^None/
      tag="all untagged"
      queryString = """SELECT date_published,title,post_id FROM post
      WHERE post_id NOT IN (SELECT DISTINCT (post_id) FROM tag)
      ORDER BY date_published DESC"""
    else

      tag = decodeURIComponent(tagType.substring(1))
      @log "Toc by tag:", tag
      #by tag
      queryString = """SELECT post.date_published AS date_published,
        post_id,post.title AS title FROM tag
        JOIN (SELECT date_published,title,post_id FROM post) AS post
        USING (post_id) WHERE value="#{tag}"
        ORDER BY date_published DESC
        """
    @cmd "dbQuery", [queryString], (res) =>
      parse_res = (res) =>
        if res.length is 0
          @emptyTocPage("#{tag}","no posts found")
          return

        markdown=""
        for i in res
          date = new Date(i.date_published*1000)
          markdown += "- [#{date.getFullYear()}-\
            #{date.getMonth()+1}-#{date.getDate()}:#{i.title}](?Post:#{i.post_id})\n"


        @applyPostdata($(".post-full"),
          title:"posts of tag:"+tag
          post_id:-1
          votes:-1
          comments:-1
          body:markdown
         ,true)
      if res.error
        @emptyTocPage("error when getting index","error when getting index")
      else
        parse_res(res)

  


  pageTocTagAll: () ->
    #list all tags only. to avoid too many duplicate post with different tag
    #first row is total post number
    #second row is tagged number
    #follow rows is tagged value,count
    @cmd "dbQuery", ["""SELECT "all" AS value,COUNT(*) AS count FROM post
           UNION ALL
           SELECT "tagged" AS value,COUNT(DISTINCT post_id) AS count
           FROM tag
           UNION ALL
           SELECT value, COUNT(post_id)
           FROM tag  GROUP BY value"""], (res) =>
      parse_res = (res) =>

        total_post = res[0].count
        if total_post is 0
          emptyTocPage("no post","no post at all")
          return
      
        markdown = ""
        tagged = res[2..]

        if tagged.length > 0
          markdown += "tagged:\n\n"

        for one in tagged
          escaped = encodeURIComponent(one.value)
          markdown += "[#{one.value}:#{one.count} post(s)]\
            (?Toc=tag:#{escaped})\n"

        untagged=total_post - res[1].count

        if untagged != 0
          markdown += "\n[untagged:#{untagged} post(s)]\
            (?Toc=tagNone)"


        @applyPostdata($(".post-full"),
          title:"index by tag"
          post_id:-1
          votes:-1
          comments:-1
          body:markdown
         ,true)
      if res.error
        @emptyTocPage("error when getting index","sorry, error happened")
      else
        parse_res(res)
      


    

  # - Pages -
  pageTocDateDesc: () ->
    @log "Toc by date desc"
    @cmd "dbQuery", ["SELECT post_id,date_published,title FROM post
        ORDER BY date_published DESC"], (res) =>
      parse_res = (res) =>

        
        #id is needed when applyPostdata

        if res.length is 0

          @emptyTocPage("no post","no post at all")
          return

        # makes next month
        month = new Date(new Date().getTime()+31*24*60*60*1000)
        markdown = ""

        for post in res
          #in current range
          post_date = new Date(post.date_published*1000)
          if post_date<month
            #new range
            month = new Date(post_date)
            month.setDate(1)
            month.setHours(0)
            month.setMinutes(0)
            month.setSeconds(0)
            #month begin with 0 should add 1
            markdown+="\n"+month.getFullYear()+" "+(month.getMonth()+1)+"\n"

          markdown+="- ["+post_date.getDate()+" \
            :"+post.title+"](?Post:#{post.post_id})\n"

        @applyPostdata($(".post-full"),
          title:"index by date"
          post_id:-1
          votes:-1
          comments:-1
          body:markdown
          ,true)

      if res.error
        @emptyTocPage("error","error while getting index")
      else
        parse_res(res)


  pagePost: () ->
    s = (+ new Date)
    @cmd "dbQuery", ["SELECT *, (SELECT COUNT(*) FROM post_vote WHERE
        post_vote.post_id = post.post_id) AS votes FROM post
        WHERE post_id = #{@post_id} LIMIT 1"], (res) =>
      parse_res = (res,tag_res) =>
        if res.length
          post = res[0]
          #post.tag is in data["tag"] table, must query and add them manually
          post.tag=[]
          for tag in tag_res
            post.tag.push(tag.value)
          @applyPostdata($(".post-full"), post, true)
          $(".post-full .like").attr("id", "post_like_#{post.post_id}")
              .off("click").off("click").on "click", @submitPostVote
          Comments.pagePost(@post_id)
        else
          $(".post-full").html("<h1>Not found</h1>")
        @pageLoaded()
        Comments.checkCert()


      tag_query = """
              SELECT value FROM tag
              WHERE post_id=#{@post_id}
              """
      self = @
 
      deal_post = (post_res,tag_res) ->
        # Temporary dbschema bug workaround
        if res.error
          self.cmd "dbQuery", ["SELECT *, -1 AS votes FROM post
            WHERE post_id = #{self.post_id} LIMIT 1"], (res)->parse_res(res,tag_res)
        else
          parse_res(res,tag_res)

      @cmd "dbQuery", [tag_query], (tag_res) ->
        if tag_res.error
          deal_post(res,[])
        else
          deal_post(res,tag_res)



  pageMain: ->
    limit = 15

    order_limit_closure = """
      ORDER BY date_published DESC
      LIMIT #{(@page-1)*limit}, #{limit} """



    query = """
      SELECT COUNT(*) as post_id,
        NULL as title,NULL as body,NULL as date_published,
        NULL as json_id, NULL as comments,NULL as votes
      FROM post
      UNION ALL
      SELECT * FROM (
      SELECT
        post.*, COUNT(comment_id) AS comments,
        (SELECT COUNT(*) FROM post_vote
        WHERE post_vote.post_id = post.post_id) AS votes
      FROM post
      LEFT JOIN comment USING (post_id)
      GROUP BY post_id
      #{order_limit_closure}
      )
    """
    @cmd "dbQuery", [query], (res) =>
      parse_res = (res,tags) =>
        total = res[0].post_id
        res = res[1..]
        s = (+ new Date)
        
        @applyPagerdata(@page, limit, total)

        res.reverse()
        for post in res

          post.tag =[]

          for tag in tags
            if post.post_id == tag.post_id
              post.tag.push(tag.value)

          elem = $("#post_#{post.post_id}")
          if elem.length == 0 # Not exits yet
            elem = $(".post.template").clone().removeClass("template")
                .attr("id", "post_#{post.post_id}")
            elem.prependTo(".posts")
            # elem.find(".score").attr("id", "post_score_#{post.post_id}")
            # .on "click", @submitPostVote # Submit vote
            elem.find(".like").attr("id", "post_like_#{post.post_id}")
                .off("click").on "click", @submitPostVote
          @applyPostdata(elem, post)
        @pageLoaded()
        @log "Posts loaded in", ((+ new Date)-s),"ms"

        $(".posts .new").off("click").on "click", => # Create new blog post
          @cmd "fileGet", ["data/data.json"], (res) =>
            data = JSON.parse(res)
            # Add to data
            data.post.unshift
              post_id: data.next_post_id
              title: "New blog post"
              date_published: (+ new Date)/1000
              body: "Blog post body"
            data.next_post_id += 1

            # Create html elements
            elem = $(".post.template").clone().removeClass("template")
            @applyPostdata(elem, data.post[0])
            elem.hide()
            elem.prependTo(".posts").slideDown()
            @addInlineEditors(elem)

            @writeData(data)
          return false

      tag_query = """
              SELECT tag.* FROM tag
              LEFT JOIN (
              SELECT post_id FROM post
              #{order_limit_closure}
              ) AS post USING (post_id)
              """
 

 
      self = @
      deal_post = (post_res,tag_res) ->
        if res.error
          # Temporary dbschema bug workaround
          query = """
            SELECT
              post.*, COUNT(comment_id) AS comments,
              -1 AS votes
            FROM post
            LEFT JOIN comment USING (post_id)
            GROUP BY post_id
            ORDER BY date_published DESC
            LIMIT #{(self.page-1)*limit}, #{limit+1}
           """
          self.cmd "dbQuery", [query], (res)-> parse_res(res,tag_res)
        else
          parse_res(res,tag_res)

      @cmd "dbQuery", [tag_query], (tag_res) ->
        if tag_res.error
          deal_post(res,[])
        else
          deal_post(res,tag_res)


  # - EOF Pages -


  # All page content loaded
  pageLoaded: =>
    $("body").addClass("loaded") # Back/forward button keep position support
    $('pre code').each (i, block) -> # Higlight code blocks
      hljs.highlightBlock(block)
    @event_page_load.resolve()
    @cmd "innerLoaded", true


  addInlineEditors: (parent) ->
    @logStart "Adding inline editors"
    elems = $("[data-editable]:visible", parent)
    for elem in elems
      elem = $(elem)
      if not elem.data("editor") and not elem.hasClass("editor")
        editor = new InlineEditor(elem, @getContent, @saveContent, @getObject)
        elem.data("editor", editor)
    @logEnd "Adding inline editors"


  # Check if publishing is necessary
  checkPublishbar: ->
    if not @data["modified"] or @data["modified"] > @site_info.content.modified
      $(".publishbar").addClass("visible")
    else
      $(".publishbar").removeClass("visible")


  # Sign and Publish site
  publish: =>
    if @site_info.privatekey # Privatekey stored in users.json
      @cmd "sitePublish", ["stored"], (res) =>
        @log "Publish result:", res
    else
      @cmd "wrapperPrompt", ["Enter your private key:", "password"],
      (privatekey) => # Prompt the private key
        $(".publishbar .button").addClass("loading")
        @cmd "sitePublish", [privatekey], (res) =>
          $(".publishbar .button").removeClass("loading")
          @log "Publish result:", res

    return false # Ignore link default event


  # Apply from data to post html element
  applyPostdata: (elem, post, full=false) ->

    #tag is passed as post property (to display tag links),
    #but it's not saved to post.tag in json
    #so must delete this property after use
    tag=post.tag
    if not tag
      tag=[]
    delete post.tag

    title_hash = post.title.replace(/[#?& ]/g, "+").replace(/[+]+/g, "+")
    elem.data("object", "Post:"+post.post_id)
    $(".title .editable", elem).html(post.title)
        .data("content", post.title)
    #valid post_id
    if post.post_id > 0
        $(".title .editable", elem).attr("href", "?Post:#{post.post_id}:#{title_hash}")

    date_published = Time.since(post.date_published)
    # Published date
    if post.body.match /^---/m # Has more over fold
      # If has break add readtime
      date_published += " &middot; #{Time.readtime(post.body)}"
      $(".more", elem).css("display", "inline-block")
          .attr("href", "?Post:#{post.post_id}:#{title_hash}")
    $(".details .published", elem).html(date_published)
        .data("content", post.date_published)


    $(".details .tag",elem).html(@tagToHtml(tag))

    $(".details .tag",elem).data("content",(tag.join(" ")))


    # Comments num
    if post.comments > 0
      $(".details .comments-num", elem).css("display", "inline")
          .attr("href", "?Post:#{post.post_id}:#{title_hash}#Comments")
      if post.comments > 1
        $(".details .comments-num .num", elem).text("#{post.comments} comments")
      else
        $(".details .comments-num .num", elem).text("#{post.comments} comment")
    else
      $(".details .comments-num", elem).css("display", "none")

    ###
    if @my_post_votes[post.post_id] # Voted on it
      $(".score-inactive .score-num", elem).text post.votes-1
      $(".score-active .score-num", elem).text post.votes
      $(".score", elem).addClass("active")
    else # Not voted on it
      $(".score-inactive .score-num", elem).text post.votes
      $(".score-active .score-num", elem).text post.votes+1

    if post.votes == 0
      $(".score", elem).addClass("noscore")
    else
      $(".score", elem).removeClass("noscore")
    ###
    if post.votes > 0
      $(".like .num", elem).text post.votes
    else if post.votes == -1  # DB bug
      $(".like", elem).css("display", "none")
    else
      $(".like .num", elem).text ""

    if @my_post_votes[post.post_id] # Voted on it
      $(".like", elem).addClass("active")


    if full
      body = post.body
    else # On main page only show post until the first --- hr separator
      body = post.body.replace(/^([\s\S]*?)\n---\n[\s\S]*$/, "$1")

    if $(".body", elem).data("content") != post.body
      $(".body", elem).html(Text.renderMarked(body)).data("content", post.body)


  # Wrapper websocket connection ready
  onOpenWebsocket: (e) =>
    @loadData()
    @cmd "siteInfo", {}, (site_info) =>
      @setSiteinfo(site_info)
      query_my_votes = """
        SELECT
          'post_vote' AS type,
          post_id AS uri
        FROM json
        LEFT JOIN post_vote USING (json_id)
        WHERE directory = 'users/#{@site_info.auth_address}'
        AND file_name = 'data.json'
      """
      @cmd "dbQuery", [query_my_votes], (res) =>
        for row in res
          @my_post_votes[row["uri"]] = 1
        @routeUrl(window.location.search.substring(1))

      @cmd "serverInfo", {}, (ret) => # Get server info
        @server_info = ret
        if @server_info.rev < 160
          @loadData("old")
      @loadLastcomments("noanim")


  # Returns the elem parent object
  getObject: (elem) =>
    return elem.parents("[data-object]:first")


  # Get content from data.json
  getContent: (elem, raw=false) =>
    [type, id] = @getObject(elem).data("object").split(":")
    id = parseInt(id)
    content = elem.data("content")
    if elem.data("editable-mode") == "timestamp" # Convert to time
      content = Time.date(content, "full")

    if elem.data("editable-mode") == "simple" or raw # No markdown
      return content
    else
      return Text.renderMarked(content)


  # Save content to data.json
  saveContent: (elem, content, cb=false) =>
    if elem.data("deletable") and content == null
    then return @deleteObject(elem, cb) # Its a delete request
    elem.data("content", content)
    [type, id] = @getObject(elem).data("object").split(":")
    id = parseInt(id)
    if type == "Post" or type == "Site"
      @saveSite(elem, type, id, content, cb)
    else if type == "Comment"
      @saveComment(elem, type, id, content, cb)



  saveSite: (elem, type, id, content, cb) ->
    @cmd "fileGet", ["data/data.json"], (res) =>
      data = JSON.parse(res)
      if type == "Post"


        changeKey=elem.data("editable")
        #tag is maintained by data["tag"],not post["tag"]
        #so must exclude tag property changes.
        if changeKey != "tag"
          post = (post for post in data.post when post.post_id == id)[0]
         
          if elem.data("editable-mode") == "timestamp" # Time parse to timestamp
            content = Time.timestamp(content)

          post[changeKey] = content

        else

          #db not allow duplicate tag of same post nor empty tag
          temp = {}
          dedup = []
          for val,idx in content.split(" ")
            if val != ""
              temp[val]=idx
          for k,v of temp
            dedup.push(k)
            

          if not data.tag
            data.tag = []
          #exclude old tag
          tag_index = (tag for tag in data.tag when tag.post_id != id)
          data["tag"] = tag_index
          #add new tag
          for tag in dedup
            data["tag"].push(
              value:tag
              post_id:id)

      else if type == "Site"
        data[elem.data("editable")] = content

      self = @
      @writeData data, (res) ->
        if cb
          if res == true # OK
            if elem.data("editable") == "tag"
              # tag list appears as links
              cb(self.tagToHtml(dedup))
            else if elem.data("editable-mode") == "simple" # No markdown
              cb(content)
            else if elem.data("editable-mode") == "timestamp" # Format timestamp
              cb(Time.since(content))
            else
              cb(Text.renderMarked(content))
          else # Error
            cb(false)



  saveComment: (elem, type, id, content, cb) ->
    @log "Saving comment...", id
    @getObject(elem).css "height", "auto"
    inner_path = "data/users/#{Page.site_info.auth_address}/data.json"
    Page.cmd "fileGet", {"inner_path": inner_path, "required": false}, (data) =>
      data = JSON.parse(data)
      comment = (
        comment for comment in data.comment when comment.comment_id == id)[0]
      comment[elem.data("editable")] = content
      json_raw = unescape(encodeURIComponent(
        JSON.stringify(data, undefined, '\t')))
      @writePublish inner_path, btoa(json_raw), (res) =>
        if res == true
          Comments.checkCert("updaterules")
          if cb then cb(Text.renderMarked(content, {"sanitize": true}))
        else
          @cmd "wrapperNotification", ["error", "File write error: #{res}"]
          if cb then cb(false)




  deleteObject: (elem, cb=False) ->
    [type, id] = elem.data("object").split(":")
    id = parseInt(id)

    if type == "Post"
      @cmd "fileGet", ["data/data.json"], (res) =>
        data = JSON.parse(res)
        if type == "Post"
          post = (post for post in data.post when post.post_id == id)[0]
          if not post then return false # No post found for this id

          if not data.tag
            data.tag=[]

          #remove all tag index from json
          tag_index = (tag for tag in data.tag when tag.post_id != id)
          data["tag"] = tag_index

          data.post.splice(data.post.indexOf(post), 1) # Remove from data

          @writeData data, (res) ->
            if cb then cb()
            if res == true then elem.slideUp()
    else if type == "Comment"
      inner_path = "data/users/#{Page.site_info.auth_address}/data.json"
      @cmd "fileGet", {"inner_path": inner_path, "required": false}, (data) =>
        data = JSON.parse(data)
        comment = (
          comment for comment in data.comment when comment.comment_id == id)[0]
        data.comment.splice(data.comment.indexOf(comment), 1)
        json_raw = unescape(encodeURIComponent(
          JSON.stringify(data, undefined, '\t')))
        @writePublish inner_path, btoa(json_raw), (res) ->
          if res == true
            elem.slideUp()
          if cb then cb()



  writeData: (data, cb=null) ->
    if not data
      return @log "Data missing"
    @data["modified"] = data.modified = Time.timestamp()
    json_raw = unescape(
       # Encode to json, encode utf8
      encodeURIComponent(JSON.stringify(data, undefined, '\t')))
    # Convert to to base64 and send
    @cmd "fileWrite", ["data/data.json", btoa(json_raw)], (res) =>
      if res == "ok"
        if cb then cb(true)
      else
        @cmd "wrapperNotification", ["error", "File write error: #{res}"]
        if cb then cb(false)
      @checkPublishbar()

    # Updating title in content.json
    @cmd "fileGet", ["content.json"], (content) =>
      # Load as raw html to prevent js bignumber problems
      content = content.replace /"title": ".*?"/,"\"title\": \"#{data.title}\""
      @cmd "fileWrite", ["content.json", btoa(content)], (res) =>
        if res != "ok"
          @cmd "wrapperNotification",
          ["error", "Content.json write error: #{res}"]

        # If the privatekey is stored sign the new content
        if @site_info["privatekey"]
          @cmd "siteSign", ["stored", "content.json"], (res) =>
            @log "Sign result", res


  writePublish: (inner_path, data, cb) ->
    @cmd "fileWrite", [inner_path, data], (res) =>
      if res != "ok" # fileWrite failed
        @cmd "wrapperNotification", ["error", "File write error: #{res}"]
        cb(false)
        return false

      @cmd "sitePublish", {"inner_path": inner_path}, (res) ->
        if res == "ok"
          cb(true)
        else
          cb(res)

  submitPostVote: (e) =>
    if not Page.site_info.cert_user_id # No selected cert
      Page.cmd "certSelect", [["zeroid.bit"]]
      return false

    elem = $(e.currentTarget)
    elem.toggleClass("active").addClass("loading")
    inner_path = "data/users/#{@site_info.auth_address}/data.json"
    Page.cmd "fileGet", {"inner_path": inner_path, "required": false}, (data) =>
      if data
        data = JSON.parse(data)
      else # Default data
        data = {"next_comment_id": 1, "comment": [], "comment_vote": {},
        "post_vote": {} }

      if not data.post_vote
        data.post_vote = {}
      post_id = elem.attr("id").match("_([0-9]+)$")[1]

      if elem.hasClass("active")
        data.post_vote[post_id] = 1
      else
        delete data.post_vote[post_id]
      json_raw = unescape(encodeURIComponent(
        JSON.stringify(data, undefined, '\t')))

      current_num = parseInt elem.find(".num").text()
      if not current_num
        current_num = 0
      if elem.hasClass("active")
        elem.find(".num").text(current_num+1)
      else
        elem.find(".num").text(current_num-1)

      Page.writePublish inner_path, btoa(json_raw), (res) =>
        elem.removeClass("loading")
        @log "Writepublish result", res

    return false

  # Parse incoming requests
  onRequest: (cmd, message) ->
    if cmd == "setSiteInfo" # Site updated
      @actionSetSiteInfo(message)
    else
      @log "Unknown command", message


  # Siteinfo changed
  actionSetSiteInfo: (message) =>
    @setSiteinfo(message.params)
    @checkPublishbar()


  setSiteinfo: (site_info) =>
    @site_info = site_info
    @event_site_info.resolve(site_info)
     # Update if username changed
    if $("body").hasClass("page-post") then Comments.checkCert()
    # User commented
    if site_info.event?[0] == "file_done" and
    site_info.event[1].match /.*users.*data.json$/
      if $("body").hasClass("page-post")
        @pagePost()
        Comments.loadComments() # Post page, reload comments
        @loadLastcomments()
      if $("body").hasClass("page-main")
        RateLimit 500, =>
          @pageMain()
          @loadLastcomments()
    else if site_info.event?[0] == "file_done" and
    site_info.event[1] == "data/data.json"
      @loadData()
      if $("body").hasClass("page-main") then @pageMain()
      if $("body").hasClass("page-post") then @pagePost()

  tagToHtml:(tag) ->
    if typeof tag is 'string'
      #input parameter must not empty nor have duplicate
      tag = tag.split(" ")
    
    if tag.length is 0
      return "tag:<a href='?Toc=tagNone'>not tagged</a>"
    
    ret = "tag:"
    
    for i in tag
      ret+=("<a href='?Toc=tag:"+encodeURIComponent(i)+"'>"+i+"</a> ")
    return ret



window.Page = new ZeroBlog()
