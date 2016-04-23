
//I don't know how to write this function as coffee script
//it's been called at two place and I don't know how to use
//-> => @ correctly
function tagToHtml(tag){
  if (typeof tag === 'string'){
    //input parameter must not empty nor have duplicate
    tag = tag.split(" ");
  }

  if (tag.length==0) {
    return "<a href='?Toc=tagNone'>not tagged</a>";    
  }


  var ret = "";

  for (i in tag){
    value = tag[i]
    ret+=("<a href='?Toc=tag:"+encodeURIComponent(value)+"'>"+value+"</a> ");
  }
  return ret;
}

