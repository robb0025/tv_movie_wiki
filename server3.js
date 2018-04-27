var express = require('express');
var url = require('url');
var fs = require('fs');
var querystring = require('querystring');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var multiparty = require('multiparty');
const sqlite3 = require('sqlite3').verbose();
var poster = require('./src/imdb_poster.js');
var sqlstring;

var app = express();
var port = 8016;


var path = require('path');
var http = require('http');

//local nodejs module
var mime = require('./src/mime.js');


var db = new sqlite3.Database('./imdb.sqlite3', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});

app.post('/subscribe', (req, res) => {
    var form = new multiparty.Form();
    var whichsql = "";
    var sqlstring;
    res.writeHead(200, {'Content-Type': 'text/html'});
    form.parse(req, (err, fields, files) => {
		console.log(err, fields, files);
		var buffer = new Array();
		var donewithquery = 4;
		console.log("HERE" + fields.search_cat);
		console.log("NAME " + fields.search_name[0]);
		var sqlstring = makesql(fields.search_name[0].toString());
		makesql(fields.search_name[0].toString());
		firstFunction(secondFunction);
			
		//build string to insert in query, checks for "*"
		function makesql(str){
			var mystring = str.replace(';','');
			mystring = mystring.replace("[", '');
			mystring = mystring.replace("]", '');
			mystring = mystring.replace("(", '');
			mystring = mystring.replace(")", '');
			str = mystring;
			
			
			var sqlstring = "";
			if(str.substring(-1,1) == "*" && str.substring(str.length-1, str.length) != "*"){
				sqlstring = sqlstring.concat("LIKE \"");
				sqlstring = sqlstring.concat('%');
				sqlstring = sqlstring.concat(str.slice(1, str.length));
				sqlstring = sqlstring.concat('\"\;');
			}
			
			if(str.substring(str.length-1, str.length) == "*" && str.substring(-1,1) != "*"){
				sqlstring = sqlstring.concat('LIKE \"');
				sqlstring = sqlstring.concat(str.slice(0, str.length-1));
				sqlstring = sqlstring.concat('%";')
			}
			
			if(str.substring(-1,1) == "*" && str.substring(str.length-1, str.length) == "*"){
				sqlstring = sqlstring.concat('LIKE \"');
				sqlstring = sqlstring.concat('%');
				sqlstring = sqlstring.concat(str.slice(1, str.length-1));
				sqlstring = sqlstring.concat('%"\;');
			}
			
			if(str.substring(-1,1) != "*"  && str.substring(str.length-1, str.length) != "*"){
				sqlstring= sqlstring.concat('=\"');
				sqlstring = sqlstring.concat(str);
				sqlstring = sqlstring.concat('\"\;');
			}
			return sqlstring;
			console.log(sqlstring);
		}	
			

		function firstFunction(_callback){

			if(fields.search_cat == "Names"){
				var sql = 'SELECT * FROM ' + fields.search_cat + ' WHERE primary_name ' + sqlstring;
				console.log("HERE2222222222222222" + fields.search_cat);
				whichsql = "people";
				db.all (sql, [], (err, rows) => {
				if (err) {
					throw err;
				}
				rows.forEach((row) => {
					
					buffer.push(row.nconst.toString());
					buffer.push(row.primary_name.toString());
					
					//birth year
					if (row.birth_year == null) {
						buffer.push("Unknown");
					} else {
						buffer.push(row.birth_year.toString());
					}

					//death year
					if (row.death_year == null) {
						buffer.push("Present");
					} else {
						buffer.push(row.death_year.toString());
					}

					//end primary profession
					if (row.primary_profession == null) {
						buffer.push("Unknown");
					} else {
						buffer.push(row.primary_profession.toString());
						
					}
				});
					_callback(buffer);//secondFunction
					donewithquery = 6;
				});
			}
			else{

				var sql = 'SELECT * FROM ' + fields.search_cat + ' WHERE primary_title ' + sqlstring;
				console.log("HERE33333333333333" + fields.search_cat);  
					db.all(sql, [], (err, rows) => {
						if (err) {
						  throw err;
						}
						rows.forEach((row) => {

							buffer.push(row.tconst.toString());
							buffer.push(row.primary_title.toString());
							
							//title type
							if(row.title_type == null){
								buffer.push("Unknown");
							}else{
								buffer.push(row.title_type.toString());
							}
							
							//start year
							if(row.start_year == null){
								buffer.push("Unknown");
							}else{							
								buffer.push(row.start_year.toString());
							}

							//end year
							if(row.end_year == null){
								buffer.push("Unknown");
							}else{
								buffer.push(row.end_year.toString());
							}
						});
							_callback(buffer);//secondFunction
							donewithquery = 6;
					});       
				}       
		}

		function secondFunction(buffer){
			// call first function and pass in a callback function which
			// first function runs when it has completed
				console.log('huzzah, I\'m done!');

			//write/replace HTML stuff here
			fs.readFile('src/table.html', (err, data) => {
				if (err) {
					res.writeHead(404, {'Content-Type': 'text/plain'});
					res.write('Uh oh - could not find file');
					res.end();
				}
				else {

					var htmlstring = "";
					var i;
					if(fields.search_cat[0] == "Titles"){
						htmlstring = htmlstring + "<tr><th>Movie Title</th><th>Info</th></tr>";
					}else{
							
						htmlstring = htmlstring + "<tr><th>Name</th><th>Info</th></tr>";
					}
					
					for(i = 0; i < buffer.length; i = + 2){

						if(whichsql != "people"){
							htmlstring = htmlstring + "<tr><td rowspan='4' ><a onclick=\"showHideLoad()\" href='?tid=" + buffer.shift() + "'>"+ buffer.shift() +"</a></td></tr>";
							htmlstring = htmlstring + "<tr><td> Title Type: "+buffer.shift() + "</td></tr>";
							htmlstring = htmlstring + "<tr><td> Start Year: "+buffer.shift() + "</td></tr>";
							htmlstring = htmlstring + "<tr><td> End Year: "+buffer.shift() + "</td></tr>";
						}else{
							htmlstring = htmlstring + "<tr><td rowspan='4' ><a onclick=\"showHideLoad()\" href='?nid="+ buffer.shift() + "'>"+ buffer.shift() +"</a></td></tr>"
							htmlstring = htmlstring + "<tr><td> Birth Year:  "+buffer.shift() + "</td></tr>";
							htmlstring = htmlstring + "<tr><td> Death Year: "+buffer.shift() + "</td></tr>";
							htmlstring = htmlstring + "<tr><td> Primary Professions: "+buffer.shift() + "</td></tr>";    
						}
					}

					var html_code = data.toString('utf8');
					 console.log("HTML PLACE")
					html_code = html_code.replace('**TITLES**', htmlstring);
					 console.log("HTML PLACE111");
					//html_code = html_code.replace('***AGE***', query.age || 'unkown');

					res.write(html_code);
					res.end();
				}
			}); 
		}  
	});
});

app.get('/', (req, res) => {
    var req_url = url.parse(req.url);
    var query = querystring.parse(req_url.query);
    
    fs.readFile('src/index.html', (err, data) => {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.write('Uh oh - could not find file');
            res.end();
        }
        else {

            res.writeHead(200, {'Content-Type': 'text/html'});         
            res.write(data);
            res.end();
        }
    });
});     
        
app.get('/about', (req, res) => {
    var req_url = url.parse(req.url);
    var query = querystring.parse(req_url.query);
    
    fs.readFile('src/about.html', (err, data) => {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.write('Uh oh - could not find file');
            res.end();
        }
        else {

            res.writeHead(200, {'Content-Type': 'text/html'});         
            res.write(data);
            res.end();
        }
    });
});



function GetTitleOrNamePage(req, res) {
    var req_url = url.parse(req.url);
    var query = querystring.parse(req_url.query);
    var buffer = new Array();
	var buffer2 = new Array();
    var knownforl = "";
    fs.readFile('src/table.html', (err, data) => {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.write('Uh oh - could not find file');
            res.end();
        }
        else {
            
            res.writeHead(200, {'Content-Type': 'text/html'});
            console.log(query);
            if(query.nid){
                first1(onehalfFunction);
                
                //gets poster image
                function first1(_callback){
					var wait = 0;
					poster.GetPosterFromNameId(query.nid, (err, data) => {
						if(!err){
                            
                            console.log(err, data);
                            buffer.push(data.host);
						    buffer.push(data.path);
							firstFunction(_callback);
                        }else{
							var path = "upload.wikimedia.org/wikipedia/en/d/d3/No-picture.jpg";
							var host = "";
							buffer.push(path);
						    buffer.push(host);
							firstFunction(_callback);
						}		
					});	
				}
            
				//gets data on a person
                function firstFunction(_callback){

                    var sql = 'SELECT * FROM Names WHERE nconst = "' + query.nid + '"\;';
                    
                    console.log("HERE2222222222222222");
                    whichsql = "people";
                    db.all (sql, [], (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    rows.forEach((row) => {

                        buffer.push(row.primary_name.toString());

                        //birth year
                        if (row.birth_year == null) {
                            buffer.push("Unknown");
                        } else {
                            buffer.push(row.birth_year.toString());
                        }

                        //death year
                        if (row.death_year == null) {
                            buffer.push("Present");
                        } else {
                            buffer.push(row.death_year.toString());
                        }

                        //end primary profession
                        if (row.primary_profession == null) {
                            buffer.push("Unknown");
                        } else {
                            buffer.push(row.primary_profession.toString());
                        }                     
                        
                        //Known for Titles
                        if (row.known_for_titles == null) {
                            buffer.push("Present");
                        } else {
                            buffer.push(row.known_for_titles.toString());
                        }
                        
                        knownfor = row.known_for_titles.toString().split(',');
                        console.log(knownfor[0]);      
                        
                        
                    });                                
                        _callback(buffer, knownfor, secondFunction);//secondFunction
                        donewithquery = 6;
                    });
                }
                
				//looks for title people are known for
                function onehalfFunction(buffer, knownfor, _callback){
                    
                    for(i = 0; i < knownfor.length; i++){
                        var sql = 'SELECT primary_title FROM Titles WHERE tconst = "' + knownfor[i] + '"\;';

                        console.log("HERE2222222222222222");
                        whichsql = "people";
                        db.all (sql, [], (err, rows) => {
							if (err) {
								throw err;
							}
							rows.forEach((row) => {
								buffer.push(row.primary_title.toString());                      
							});                                   
                        });                     
                    }
                    
                    if(i = knownfor.length-1){
                            _callback(buffer, knownfor.length);//secondFunction
                    }                  
                } 

				//makes the html to send to client
				function secondFunction(buffer, number_movies){
					// call first function and pass in a callback function which
					// first function runs when it has completed
						console.log('huzzah, I\'m done!');

					//write/replace HTML stuff here
					fs.readFile('src/people.html', (err, data) => {
						if (err) {
							res.writeHead(404, {'Content-Type': 'text/plain'});
							res.write('Uh oh - could not find file');
							res.end();
						}
						else {

							var htmlstring = "";
							var i;
							var movie_ids;
							var moive_ids_array;

							htmlstring = htmlstring + "<tr><th>Name</th><th>Info</th></tr>";
						
							
							htmlstring = htmlstring + "<td rowspan='5'><img src=\"https://"+ buffer.shift() + buffer.shift()+"\">  " + buffer.shift() +"</td></tr>"
							htmlstring = htmlstring + "<tr><td> Birth Year:  "+buffer.shift() + "<button id=\"edit_button\" style=\"float: right\; color: black\;\" onclick=\"showHideBirth()\">Edit Birth Year</button></td></tr>";
							htmlstring = htmlstring + "<tr><td> Death Year: "+buffer.shift() + "<button id=\"edit_button\" style=\"float: right\; color: black\;\" onclick=\"showHideDeath()\">Edit Death Year</button></td></tr>";
							htmlstring = htmlstring + "<tr><td> Primary Professions: "+buffer.shift() + "<button id=\"edit_button\" style=\"float: right\; color: black\;\" onclick=\"showHidePro()\">Edit Professions</button></td></tr>";  
							movie_ids = buffer.shift();
							console.log(movie_ids.toString());
							movie_ids_array = movie_ids.split(',');
							htmlstring = htmlstring + "<tr><td> Known For: ";
							for(i = 0; i < number_movies; i++){
								htmlstring = htmlstring + '<a onclick=\"showHideLoad()\" href="http://cisc-dean.stthomas.edu:8016/subscribe?tid=' + movie_ids_array[i] + '">' + buffer.shift() + '</a> , ';
							}
							htmlstring = htmlstring + "</td></tr>";
                            
                            
                            htmlstring = htmlstring + "<div id=\"myBirth\" style=\"display: none;\">";
                            htmlstring = htmlstring + "<p>Select Birth Year</p><form action=\"/change_dob?nid="+ query.nid +"\" enctype=\"multipart/form-data\" method=\"POST\">";
                            htmlstring = htmlstring + "<input type=\"number\" name=\"genre\"><br>";
                            htmlstring = htmlstring + "<input onclick=\"showHideLoad()\" type=\"submit\" value=\"Save Birth Year\"></form></div>";
                            
                            htmlstring = htmlstring + "<div id=\"myDeath\" style=\"display: none;\">";
                            htmlstring = htmlstring + "<p>Select Death Year</p><form action=\"/change_death?nid="+ query.nid +"\" enctype=\"multipart/form-data\" method=\"POST\">";
                            htmlstring = htmlstring + "<input type=\"text\" name=\"genre\" ><br>";
                            htmlstring = htmlstring + "<input onclick=\"showHideLoad()\" type=\"submit\" value=\"Save Death Year\"></form></div>";
                            
                             htmlstring = htmlstring + "<div id=\"myPro\" style=\"display: none;\">";
                            htmlstring = htmlstring + "<p>Select Professions</p><form  name=\"form1\" action=\"/change_pro?nid="+ query.nid +"\" enctype=\"multipart/form-data\" method=\"POST\">";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"actor\" onclick=\"chkcontrol(0)\">actor<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"director\" onclick=\"chkcontrol(1)\">director<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"writer\" onclick=\"chkcontrol(2)\">writer<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"producer\" onclick=\"chkcontrol(3)\">producer<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"assistant_director\" onclick=\"chkcontrol(4)\">assistant_director<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"production_manager\" onclick=\"chkcontrol(5)\">production_manager<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"actress\" onclick=\"chkcontrol(6)\">actress<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"art_department\" onclick=\"chkcontrol(7)\" >art_department<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"sound_department\" onclick=\"chkcontrol(8)\">sound_department<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"miscellaneous\" onclick=\"chkcontrol(8)\">miscellaneous<br>";
                            htmlstring = htmlstring + "<input type=\"submit\" onclick=\"showHideLoad()\" value=\"Save Professions\"></form></div>";
							

							var html_code = data.toString('utf8');
							 console.log("HTML PLACE")
							html_code = html_code.replace('**TITLES**', htmlstring);
							 console.log("HTML PLACE111");
							//html_code = html_code.replace('***AGE***', query.age || 'unkown');

							res.write(html_code);
							res.end();                      
						}
					}); 
				}  
			}
            
            
            if(query.tid){
                first(secondFunc);
				
				//get poster image for a given movie
				function first(_callback){
					var wait = 0;
					poster.GetPosterFromTitleId(query.tid, (err, data) => {
						if(!err){
                            
                            console.log(err, data);
                            buffer.push(data.host);
						    buffer.push(data.path);
							firstFunc(_callback);
                        }else{
							var path = "upload.wikimedia.org/wikipedia/en/d/d3/No-picture.jpg";
							var host = "";
							buffer.push(path);
						    buffer.push(host);
							firstFunc(_callback);
						}
					});	
				}
				
				//querys information on a movie
                function firstFunc(_callback){

                    var sql = 'SELECT * FROM Titles LEFT JOIN Ratings ON Titles.tconst=Ratings.tconst WHERE Titles.tconst = "' + query.tid + '"\;';
                    console.log("HERE2222222222222222");
					console.log(query.tid);
                    whichsql = "people";
                    db.all(sql, [], (err, rows) => {
                    if (err) {
                      throw err;
                    }else{
					console.log("HERE", rows);	
                    rows.forEach((row) => {
                       	console.log("Title error:", err);
						console.log(query.tid, row);
                        buffer.push(row.primary_title.toString());

                        //title type
                        if(row.title_type == null){
                            buffer.push("Unknown");
                        }else{
                            buffer.push(row.title_type.toString());
                        }
                        
                        //start year
                        if(row.start_year == null){
                            buffer.push("Unknown");
                        }else{							
                            buffer.push(row.start_year.toString());
                        }

                        //end year
                        if(row.end_year == null){
                            buffer.push("Unknown");
                        }else{
                            buffer.push(row.end_year.toString());
                        }
                        
                        //runtime in minutes
                        if(row.runtime_minutes == null){
                            buffer.push("Unknown");
                        }else{
                            buffer.push(row.runtime_minutes.toString());
                        }
                        
                        //genre
                        if(row.genres == null){
                            buffer.push("Unknown");
                        }else{
                            buffer.push(row.genres.toString());
                        }
                        
                        //average_rating
                        if(row.average_rating == null){
                            buffer.push("Unknown");
                        }else{
                            buffer.push(row.average_rating.toString());
                        }
                        
                        //num_votes
                        if(row.num_votes == null){
                            buffer.push("Unknown");
                        }else{
                            buffer.push(row.num_votes.toString());
                        }
                        
                    });
                        beforesecond(buffer, _callback);
                    }});
                    
                }
                
				//get Top Paid
				function beforesecond(buffer, _callback){

					var sql = 'SELECT nconst, ordering, primary_name FROM Names INNER NATURAL JOIN Principals WHERE tconst = "' + query.tid + '" ORDER BY Principals.ordering ASC\;';
					var number_princ = 0;
					console.log("HERE2222222222222222");
					whichsql = "people";
					db.all (sql, [], (err, rows) => {
						if (err) {
							throw err;
						}
                        
						rows.forEach((row) => {
                            console.log("TOP PAID: " + row.nconst.toString());
							buffer2.push(row.nconst.toString());
                            buffer2.push(row.primary_name.toString());
							buffer2.push(row.ordering.toString());
							number_princ++;
							
						});          
						 _callback(buffer, number_princ);//secondFunction
					});	
				}
                
                
				function secondFunc(buffer, number_princ){
					// call first function and pass in a callback function which
					// first function runs when it has completed
						console.log('huzzah, I\'m done!');

					//write/replace HTML stuff here
					fs.readFile('src/table.html', (err, data) => {
						if (err) {
							res.writeHead(404, {'Content-Type': 'text/plain'});
							res.write('Uh oh - could not find file');
							res.end();
						}
						else {

							var htmlstring = "";
							var i;
							console.log(buffer);
							htmlstring = htmlstring + "<tr><th>Movie Title</th><th>Info</th></tr>";
							
							//htmlstring = htmlstring + "<tr><img src=\"https://"+ buffer.shift() + buffer.shift()+"\">";
							htmlstring = htmlstring + "<td rowspan='8'><img src=\"https://"+ buffer.shift() + buffer.shift()+"\">  " + buffer.shift() +"</td></tr>"
							htmlstring = htmlstring + "<tr><td> Type:  "+buffer.shift() + "<button id=\"edit_button\" style=\"float: right\; color: black\;\" onclick=\"showHideType()\">Edit Type</button></td></tr>";
							htmlstring = htmlstring + "<tr><td> Start Year: "+buffer.shift() + "</td></tr>";
							htmlstring = htmlstring + "<tr><td> End Year: "+buffer.shift() + "</td></tr>";
							htmlstring = htmlstring + "<tr><td> Runtime: "+buffer.shift() + " minutes</td></tr>";
							htmlstring = htmlstring + "<tr><td> Genre: "+buffer.shift() + "<button style=\"float: right; color: black\;\" id=\"edit_button\" onclick=\"showHideGenre()\">Edit Genre</button></td></tr>";
                            
                            //change genre html
                            htmlstring = htmlstring + "<div id=\"myGenre\" style=\"display: none;\">";
                            htmlstring = htmlstring + "<p>Select Grenes</p><form  name=\"form1\" action=\"/change_genre?tid="+ query.tid +"\" enctype=\"multipart/form-data\" method=\"POST\">";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"Drama\" onclick=\"chkcontrol(0)\">Drama<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"Action\" onclick=\"chkcontrol(1)\">Action<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"Kid\" onclick=\"chkcontrol(2)\">Kid<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"Horror\" onclick=\"chkcontrol(3)\">Horror<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"Comedy\" onclick=\"chkcontrol(4)\">Comedy<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"Thirller\" onclick=\"chkcontrol(5)\">Thirller<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"Crime\" onclick=\"chkcontrol(6)\">Crime<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"Romance\" onclick=\"chkcontrol(7)\" >romance<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"Animation\" onclick=\"chkcontrol(8)\">Animation<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"Sci-Fi\" onclick=\"chkcontrol(9)\">Sci-Fi<br>";
                            htmlstring = htmlstring + "<input onclick=\"showHideLoad()\" type=\"submit\" value=\"Save Genre\"></form></div>";
                            
                            htmlstring = htmlstring + "<div id=\"myType\" style=\"display: none;\">";
                            htmlstring = htmlstring + "<p>Select Type</p><form  name=\"form2\" action=\"/change_type?tid="+ query.tid +"\" enctype=\"multipart/form-data\" method=\"POST\">";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"Movie\" onclick=\"chkcontrol(0)\">Movie<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"Short\" onclick=\"chkcontrol(1)\">Short<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"Documentary\" onclick=\"chkcontrol(2)\">Documentary<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"TvSeries\" onclick=\"chkcontrol(3)\">TvSeries<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"videoGame\" onclick=\"chkcontrol(4)\">videoGame<br>";
                            htmlstring = htmlstring + "<input type=\"checkbox\" name=\"genre\" value=\"Other\" onclick=\"chkcontrol(5)\">Other<br>";
                            htmlstring = htmlstring + "<input onclick=\"showHideLoad()\" type=\"submit\" value=\"Save Type\"></form></div>";
                            
							htmlstring = htmlstring + "<tr><td> Average Rating: "+buffer.shift() + "</td></tr>";
							htmlstring = htmlstring + "<tr><td> Number of votes: "+buffer.shift() + "</td></tr>";
						
							var htmlstring2 = "";
						
							for(i = 0; i < number_princ; i++){
								htmlstring2 = htmlstring2 + "<tr><td><a onclick=\"showHideLoad()\" href=\"http:\/\/cisc-dean.stthomas.edu:8016/subscribe?nid=" + buffer2.shift() + "\">"+buffer2.shift()+"</a></td>";
								htmlstring2 = htmlstring2 + "<td>" + buffer2.shift() + "</td></tr>";
							}
								

							var html_code = data.toString('utf8');
							 console.log("HTML PLACE")
							html_code = html_code.replace('**TITLES**', htmlstring);
							html_code = html_code.replace('**TABLE**', htmlstring2);
							 console.log("HTML PLACE111");
							//html_code = html_code.replace('***AGE***', query.age || 'unkown');

							 console.log("HTML PLACE2222");
							res.write(html_code);
							res.end();
						}
					}); 
				}  
			}
        }
    });
}

app.get('/subscribe', GetTitleOrNamePage);
app.get('/change_genre', GetTitleOrNamePage);

app.post('/change_genre', (req, res) => {
    var req_url = url.parse(req.url);
    var form = new multiparty.Form();
    var whichsql = "";
    var sqlstring;
	var buffer2 = new Array();
    var query = querystring.parse(req_url.query);
    //res.writeHead(200, {'Content-Type': 'text/html'});
    form.parse(req, (err, fields, files) => {
		console.log(err, fields, files);
		var buffer = new Array();
        var genre_string = "";
        var i = 0;
        console.log(fields);
        for(i=0; i < fields.genre.length; i++){
            
            buffer.push(fields.genre[i]);
        }
        
        for(i=0; i < fields.genre.length; i++){
            if( i < fields.genre.length-1){
               genre_string = genre_string + buffer.shift() + ", "; 
            }else{
                genre_string = genre_string + buffer.shift();
            }
            console.log("hi there omar");
        }
        
        console.log("genre_string", genre_string); 
        console.log(query);  
        
        var sql = "UPDATE Titles SET genres = \"" + genre_string + "\" WHERE tconst =\""+ query.tid+ "\";";
 
        db.run(sql, [], function(err) {
			if (!err) {
				console.log(`Row(s) updated: ${this.changes}`);
                GetTitleOrNamePage(req, res);
				//res.writeHead(200, {'Content-Type': 'text/plain'})
                //res.write("hello");
                //res.send();
			}
			
        });     
    });
});

app.post('/change_type', (req, res) => {
    var req_url = url.parse(req.url);
    var form = new multiparty.Form();
    var whichsql = "";
    var sqlstring;
	var buffer2 = new Array();
    var query = querystring.parse(req_url.query);
    //res.writeHead(200, {'Content-Type': 'text/html'});
    form.parse(req, (err, fields, files) => {
		console.log(err, fields, files);
		var buffer = new Array();
        var genre_string = "";
        var i = 0;
        console.log(fields);
        for(i=0; i < fields.genre.length; i++){
            
            buffer.push(fields.genre[i]);
        }
        
        for(i=0; i < fields.genre.length; i++){
            if( i < fields.genre.length-1){
               genre_string = genre_string + buffer.shift() + ", "; 
            }else{
                genre_string = genre_string + buffer.shift();
            }
            console.log("hi there omar");
        }
        
        console.log("genre_string", genre_string); 
        console.log(query);  
        
        var sql = "UPDATE Titles SET title_type = \"" + genre_string + "\" WHERE tconst =\""+ query.tid+ "\";";
 
        db.run(sql, [], function(err) {
			if (!err) {
				console.log(`Row(s) updated: ${this.changes}`);
                GetTitleOrNamePage(req, res);
				//res.writeHead(200, {'Content-Type': 'text/plain'})
                //res.write("hello");
                //res.send();
			}
			
        });     
    });
});

app.get('/change_type', GetTitleOrNamePage);


app.post('/change_dob', (req, res) => {
    var req_url = url.parse(req.url);
    var form = new multiparty.Form();
    var whichsql = "";
    var sqlstring;
	var buffer2 = new Array();
    var query = querystring.parse(req_url.query);
    //res.writeHead(200, {'Content-Type': 'text/html'});
    form.parse(req, (err, fields, files) => {
		console.log(err, fields, files);
		var buffer = new Array();
        var genre_string = "";
        var i = 0;
        console.log(fields);
        for(i=0; i < fields.genre.length; i++){
            
            buffer.push(fields.genre[i]);
        }
        
        for(i=0; i < fields.genre.length; i++){
            if( i < fields.genre.length-1){
               genre_string = genre_string + buffer.shift() + ", "; 
            }else{
                genre_string = genre_string + buffer.shift();
            }
            console.log("hi there omar");
        }
        
        console.log("genre_string", genre_string); 
        console.log(query);  
        
        var sql = "UPDATE Names SET birth_year = \"" + genre_string + "\" WHERE nconst =\""+ query.nid+ "\";";
 
        db.run(sql, [], function(err) {
			if (!err) {
				console.log(`Row(s) updated: ${this.changes}`);
                GetTitleOrNamePage(req, res);
				//res.writeHead(200, {'Content-Type': 'text/plain'})
                //res.write("hello");
                //res.send();
			}
			
        });     
    });
});

app.get('/change_dob', GetTitleOrNamePage);

app.post('/change_death', (req, res) => {
    var req_url = url.parse(req.url);
    var form = new multiparty.Form();
    var whichsql = "";
    var sqlstring;
	var buffer2 = new Array();
    var query = querystring.parse(req_url.query);
    //res.writeHead(200, {'Content-Type': 'text/html'});
    form.parse(req, (err, fields, files) => {
		console.log(err, fields, files);
		var buffer = new Array();
        var genre_string = "";
        var i = 0;
        console.log(fields);
        for(i=0; i < fields.genre.length; i++){
            
            buffer.push(fields.genre[i]);
        }
        
        for(i=0; i < fields.genre.length; i++){
            if( i < fields.genre.length-1){
               genre_string = genre_string + buffer.shift() + ", "; 
            }else{
                genre_string = genre_string + buffer.shift();
            }
            console.log("hi there omar");
        }
        
        console.log("genre_string", genre_string); 
        console.log(query);  
        
        var sql = "UPDATE Names SET death_year = \"" + genre_string + "\" WHERE nconst =\""+ query.nid+ "\";";
 
        db.run(sql, [], function(err) {
			if (!err) {
				console.log(`Row(s) updated: ${this.changes}`);
                GetTitleOrNamePage(req, res);
				//res.writeHead(200, {'Content-Type': 'text/plain'})
                //res.write("hello");
                //res.send();
			}
			
        });     
    });
});

app.get('/change_death', GetTitleOrNamePage);

app.post('/change_pro', (req, res) => {
    var req_url = url.parse(req.url);
    var form = new multiparty.Form();
    var whichsql = "";
    var sqlstring;
	var buffer2 = new Array();
    var query = querystring.parse(req_url.query);
    //res.writeHead(200, {'Content-Type': 'text/html'});
    form.parse(req, (err, fields, files) => {
		console.log(err, fields, files);
		var buffer = new Array();
        var genre_string = "";
        var i = 0;
        console.log(fields);
        for(i=0; i < fields.genre.length; i++){
            
            buffer.push(fields.genre[i]);
        }
        
        for(i=0; i < fields.genre.length; i++){
            if( i < fields.genre.length-1){
               genre_string = genre_string + buffer.shift() + ", "; 
            }else{
                genre_string = genre_string + buffer.shift();
            }
            console.log("hi there omar");
        }
        
        console.log("genre_string", genre_string); 
        console.log(query);  
        
        var sql = "UPDATE Names SET primary_profession = \"" + genre_string + "\" WHERE nconst =\""+ query.nid+ "\";";
 
        db.run(sql, [], function(err) {
			if (!err) {
				console.log(`Row(s) updated: ${this.changes}`);
                GetTitleOrNamePage(req, res);
				//res.writeHead(200, {'Content-Type': 'text/plain'})
                //res.write("hello");
                //res.send();
			}
			
        });     
    });
});

app.get('/change_pro', GetTitleOrNamePage);


app.listen(port);
