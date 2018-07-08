# ZeroBlog
Demo for decentralized, self publishing blogging platform.

<<<<<<< HEAD
## Screenshot

![Screenshot](http://i.imgur.com/diTYHcm.png) 

ZeroNet address: http://127.0.0.1:43110/1BLogC9LN4oPDcruNz3qo1ysa133E9AGg8
=======
You can clone it from [here](zero://15mSYzsDxzarssqtV1pFPKqoCTaLdjVB2f/).

If you want to upgrade your present ZeroBlog to this one. Backup your blog first, then edit the `content.json` in your blog root directory and change the `"cloned_from": "..."` to `"cloned_from": "15mSYzsDxzarssqtV1pFPKqoCTaLdjVB2f"` and sign it, then go to ZeroHello, from the site option (click the 3-dot button near your blog) and choose `Upgrade code`. That's all.
>>>>>>> 2317591271c6f9d71fc1b67584cd2ecfb3b80917

If you want to use the dark theme, open `index.html` in the zite root folder and add this line:

```diff
...
 <link rel="stylesheet" href="css/all.css" />
+ <link rel="stylesheet" href="dark.css" />
...
```
Then sign and publish your zite.

To change the avatar replace the image /img/avatar.png with a new png, 60 by 60 pixels is recommended.