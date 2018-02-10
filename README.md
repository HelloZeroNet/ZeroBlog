# ZeroBlog Plus
There is [a ZeroBlog that supports tag and date index](https://github.com/zeronetscript/ZeroBlog/tree/toc_by_tag), but it's based on an old version, which doesn't support alloy-editor and image inserting yet. I use the awesome [meld tool](http://meldmerge.org/) and merge the code base, also add some mobile support.

You can clone it from [here](zero://15mSYzsDxzarssqtV1pFPKqoCTaLdjVB2f/).

If you want to upgrade your present ZeroBlog to this one. Backup your blog first, then edit the `content.json` in your blog root directory and change the `"cloned_from": "..."` to `"cloned_from": "15mSYzsDxzarssqtV1pFPKqoCTaLdjVB2f"` and sign it, then go to ZeroHello, from the site option (click the 3-dot button near your blog) and choose `Upgrade code`. That's all.

If you want to use the dark theme, open `index.html` in the zite root folder and add this line:

```diff
...
 <link rel="stylesheet" href="css/all.css" />
+ <link rel="stylesheet" href="dark.css" />
...
```
Then sign and publish your zite.

To change the avatar replace the image /img/avatar.png with a new png, 60 by 60 pixels is recommended.