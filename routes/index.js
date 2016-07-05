var express = require('express');
var router = express.Router();
var Forecast = require('forecast');
var request = require('request');
var request = require("request")



var theWeather;
var theMessages;
var theBirthdays;
var urlMessages = 'http://patrickroux.ca/magicmirror/pamxnkjfhg8765kf/messages.json';
var urlBirthdays = 'http://patrickroux.ca/magicmirror/pamxnkjfhg8765kf/birthdays.json';

request({
    url: urlBirthdays,
    json: true
}, function (error, response, body) {
	//if (error) throw error;
    if (!error && response.statusCode === 200) {
        theBirthdays = body; // Print the json response
    }
})

request({
    url: urlMessages,
    json: true
}, function (error, response, body) {
	//if (error) throw error;
    if (!error && response.statusCode === 200) {
        theMessages = body; // Print the json response
    }
})



function degToCompass(num) {
    var val = Math.floor((num / 22.5) + 0.5);
    var arr = 
    	["Nord", 
    	"Nord Nord Est",
    	"Nord Est",
    	"Est Nord Est",
    	"Est",
    	"Est Sud Est",
    	"Sus Est",
    	"Sud Sud Est",
    	"Sud",
    	"Sud Sud Ouest",
    	"Sud Ouest",
    	"Ouest Sud Ouest",
    	"Ouest",
    	"Ouest Nord Ouest",
    	"Nord Ouest",
    	"Nord Nord Ouest"];
    return arr[(val % 16)];
}

function degToCompassAbrege(num) {
    var val = Math.floor((num / 22.5) + 0.5);
    var arr = 
    	["n", 
    	"nne",
    	"ne",
    	"ene",
    	"e",
    	"ese",
    	"se",
    	"sse",
    	"s",
    	"ssw",
    	"sw",
    	"wsw",
    	"w",
    	"wnw",
    	"nw",
    	"nnw"];
    return arr[(val % 16)];
}










//https://api.forecast.io/forecast/e0bfc43046270509857148c6c45e8147/37.8267,-122.423?lang=fr
//FORECAST

// Initialize 
//Pour le laguage, en cas de mise a jour
//penser a modifier providers/forecast.io/index.js juste apres var units = this.options.u...
//Voir https://github.com/jameswyse/forecast/pull/5/files
  // add language parameter
  // if (this.options.lang) {
  //   if (units) units += '&';
  //   units += 'lang=' + this.options.lang;
  // }

var forecast = new Forecast({
	service: 'forecast.io',
	key: 'e0bfc43046270509857148c6c45e8147',
	units: 'celcius', // Only the first letter is parsed 
	lang: 'fr',
	cache: true,      // Cache API requests? 
	ttl: {            // How long to cache requests. Uses syntax from moment.js: http://momentjs.com/docs/#/durations/creating/ 
		minutes: 0,
		seconds: 1
	}
});
 
// Retrieve weather information from coordinates
forecast.get([45.5088400, -73.5878100], true, function(err, weather) {
	if(err) return console.dir(err);
	theWeather = weather;
});






function getTomorrowsBirthday(myJson){

	var tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);

	var d = tomorrow.getDate(),
	    m = tomorrow.getMonth()+1;

    var birthdayGuys = "";
    var nbBirthdayGuys = 0;

	if (d < 10) d = "0" + d;
	if (m < 10) m = "0" + m;

	tomorrowStr = d+"/"+m;

    var i = null;
    for (i = 0; myJson["data"].length > i; i += 1) {

    	if(tomorrowStr == myJson["data"][i].birthday){
    		if(nbBirthdayGuys > 0)
    			birthdayGuys += ", ";
    		birthdayGuys += myJson["data"][i].name;
    		nbBirthdayGuys++;
    	}
    }
    return birthdayGuys;
}


function getRandomMessage(myJson){
	return myJson["data"][Math.floor(Math.random()*myJson["data"].length)].message;
}



function timeConverter(UNIX_timestamp){
	var a = new Date(UNIX_timestamp * 1000);
	var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	var year = a.getFullYear();
	var month = months[a.getMonth()];
	var date = a.getDate();
	var hour = a.getHours();
	var min = a.getMinutes();
	var sec = a.getSeconds();
	var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
	return time;
}
function hourConverter(UNIX_timestamp){
	var a = new Date(UNIX_timestamp * 1000);
	var hour = a.getHours().toLocaleString('fr-FR', {minimumIntegerDigits: 2, useGrouping:false});
	var min = a.getMinutes().toLocaleString('fr-FR', {minimumIntegerDigits: 2, useGrouping:false});
	var time = hour + 'h' + min ;
	return time;
}

function getDayOfTheWeek(UNIX_timestamp){
	var a = new Date(UNIX_timestamp*1000);
	var days = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
	return days[a.getDay()];
}



//Weather Data refresh for page reload
setInterval(function() {
	console.log("Weather reloaded");
	forecast.get([45.5088400, -73.5878100], true, function(err, weather) {
  	if(err) return console.dir(err);
	  	theWeather = weather;
		console.log(theWeather.currently.time);
	});
}, 60000);




//Birthday Data refresh for page reload
setInterval(function() {
	console.log("Birthdays reloaded");
	request({
    url: urlBirthdays,
    json: true
	}, function (error, response, body) {
		if (error) throw error;
	    if (!error && response.statusCode === 200) {
	        theBirthdays = body; // Print the json response
	    }
	})

}, 3600000);




//Messages Data refresh for page reload
setInterval(function() {
	console.log("Messages reloaded");
	request({
	    url: urlMessages,
	    json: true
	}, function (error, response, body) {
		if (error) throw error;
	    if (!error && response.statusCode === 200) {
	        theMessages = body; // Print the json response
	    }
	})

}, 9000000);
















router.get('/', function(req, res){

	console.log("Index reloaded");

	//minutely : pour la prochaine heure
	//hourly : prochaines 24h
	//daily : 7 prochains jours, premiere valeur aujourd'Hui

	res.render('index', {
		partials: {
			weather: 'weather', 
		},

		//Actuellement
		// nowProbPrecipitations:Math.round(theWeather.currently.humidity * 100),
		// nowTemperature:Math.round(parseFloat(theWeather.currently.temperature, 10)),
		// nowTemperatureRessentie:Math.round(parseFloat(theWeather.currently.apparentTemperature, 10)),
		// nowVitesseVent:Math.round(1.60934*(theWeather.currently.windSpeed)),
		// nowDirectionVent:degToCompass(theWeather.currently.windBearing),

		//Pour la journée J+1
		iconeMeteo : theWeather.daily.data[1].icon.toUpperCase().replace(/-/g, "_"),
		time:timeConverter(theWeather.currently.time),
		resume:theWeather.daily.data[1].summary,
		leverSoleil:hourConverter(theWeather.daily.data[1].sunriseTime),
		coucherSoleil:hourConverter(theWeather.daily.data[1].sunsetTime),
		vitesseVent:Math.round(1.60934*(theWeather.daily.data[1].windSpeed)),
		directionVent:degToCompassAbrege(theWeather.daily.data[1].windBearing),
		probPrecipitations:Math.round(theWeather.daily.data[1].precipProbability*100),
		J1_Min : Math.round(theWeather.daily.data[1].temperatureMin),
		J1_MinApp : Math.round(theWeather.daily.data[1].apparentTemperatureMin),
		J1_Max : Math.round(theWeather.daily.data[1].temperatureMax),
		J1_MaxApp : Math.round(theWeather.daily.data[1].apparentTemperatureMax),

		//J+2
		J2_JourSemaine : getDayOfTheWeek(theWeather.daily.data[2].time),
		J2_Icone : theWeather.daily.data[2].icon.toUpperCase().replace(/-/g, "_"),
		J2_Min : Math.round(theWeather.daily.data[2].temperatureMin),
		J2_MinApp : Math.round(theWeather.daily.data[2].apparentTemperatureMin),
		J2_Max : Math.round(theWeather.daily.data[2].temperatureMax),
		J2_MaxApp : Math.round(theWeather.daily.data[2].apparentTemperatureMax),
		J2_probPrecipitations:Math.round(theWeather.daily.data[2].precipProbability*100),
		//J+3
		J3_JourSemaine : getDayOfTheWeek(theWeather.daily.data[3].time),
		J3_Icone : theWeather.daily.data[3].icon.toUpperCase().replace(/-/g, "_"),
		J3_Min : Math.round(theWeather.daily.data[3].temperatureMin),
		J3_MinApp : Math.round(theWeather.daily.data[3].apparentTemperatureMin),
		J3_Max : Math.round(theWeather.daily.data[3].temperatureMax),
		J3_MaxApp : Math.round(theWeather.daily.data[3].apparentTemperatureMax),
		J3_probPrecipitations:Math.round(theWeather.daily.data[3].precipProbability*100),
		//J+4
		J4_JourSemaine : getDayOfTheWeek(theWeather.daily.data[4].time),
		J4_Icone : theWeather.daily.data[4].icon.toUpperCase().replace(/-/g, "_"),
		J4_Min : Math.round(theWeather.daily.data[4].temperatureMin),
		J4_MinApp : Math.round(theWeather.daily.data[4].apparentTemperatureMin),
		J4_Max : Math.round(theWeather.daily.data[4].temperatureMax),
		J4_MaxApp : Math.round(theWeather.daily.data[4].apparentTemperatureMax),
		J4_probPrecipitations:Math.round(theWeather.daily.data[4].precipProbability*100),
		//J+5
		J5_JourSemaine : getDayOfTheWeek(theWeather.daily.data[5].time),
		J5_Icone : theWeather.daily.data[5].icon.toUpperCase().replace(/-/g, "_"),
		J5_Min : Math.round(theWeather.daily.data[5].temperatureMin),
		J5_MinApp : Math.round(theWeather.daily.data[5].apparentTemperatureMin),
		J5_Max : Math.round(theWeather.daily.data[5].temperatureMax),
		J5_MaxApp : Math.round(theWeather.daily.data[5].apparentTemperatureMax),
		J5_probPrecipitations:Math.round(theWeather.daily.data[5].precipProbability*100),

		//Birthdays
		birthdayGuys : getTomorrowsBirthday(theBirthdays),

		//Messages
		randomMessage : getRandomMessage(theMessages),

	});
});

module.exports = router;
