var mime_types = {
    html: 'text/html',
    css: 'text/css',
    js : 'application/javascript',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif'
};


function hello(){
        console.log('hello');
}

module.exports={};

module.exports.mime_types = mime_types;
module.exports.version = '0.0.0';
module.exports.world = function(){
           console.log('world');
};

