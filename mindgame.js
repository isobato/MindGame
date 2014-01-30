///<playerName></playerName>
///<level>{4, 6, 8}</level>
function MindGame(playerName, level)
{
	this.PlayerName = playerName;

	this.GameGrid = MindGame.scrambleArray(level);

    this.NumberOfGuessedNodes = 0;
	this.Clicks = 0;
	this.Score = 0;

	this.Timer = 0;  //Initiate StopWatch
	this.clickQueue = new Array();
}

MindGame.scrambleArray = function(level)
{
	var grid = new Array(level^2);
	//iniciate collection counter
	var a = new Array();
	for(var i=0; i<level; i++) a[i]=0;

	//Randomly select r-numbers less then level value.
	//Also count how many the same r you have and do not exceed 4 when level=4 or 6 when level=6, etc.
	for(var i=1; i<=level; i++)
		for( var j=1; j<=level; j++)
		{
			
			do{ r = Math.floor(Math.random()*level); }
			while(a[r]==level) //if there are already max allowed of this one, generate another

			a[r]++; //count how many this ones you've generated;

			grid[""+i+"-"+j+""]=r;
		}   
	return grid;
}

///<e> javascript event </e>
MindGame.prototype.clicked = function(e)
{
    if( this.clickQueue.length > 1) return;                     //Only two open

	this.Clicks += 1;
	this.clickQueue.push(e);                                     //Register click in the queue
	this.showElement(e);

	if(this.clickQueue.length > 1)
	{															//Second click registred
		if( this.clickQueue[0].id == this.clickQueue[1].id)
			this.hideElement(this.clickQueue[0]);				//Same card clicked. Close it!
		else
		{
			if( this.GameGrid[this.clickQueue[0].id] === this.GameGrid[this.clickQueue[1].id] )
				this.score();									//Another card clicked. Guessed. Score it!
		}
		setTimeout(function(){this.emptyQueue();}.bind(this), 450);
	}
}
MindGame.prototype.emptyQueue = function()
{
	try{
		this.hideElement(this.clickQueue[0]); 
		this.hideElement(this.clickQueue[1]);
	}
	catch(ex){}
    this.clickQueue.length = 0;
}
MindGame.prototype.showElement = function(e)
{
	if(e.childNodes.length>1)   return;
	var e1=document.createElement('img');
	e1.src = TheGame.Theme.getImageSrc(TheGame.MindGame.GameGrid[e.id]);
	e1.className = "back";

	e.classList.add("reveal");
	e.appendChild(e1);
}
MindGame.prototype.hideElement = function(e)
{
	e.classList.remove("reveal");
	e.childNodes[1].remove();
}

MindGame.prototype.score = function()
{
	//Exponencijalna funkcija a^x sa osnovom 0<a<1 daje mogućnost jedinstvene score tabele za sve nivoe igre.
	//Pravi pravilnu raspodelu bodova po nivou igre i proteklom vremenu. 
	//Što je nivo igre veći, veći je dodatak na skor; Što je proteklo vreme veće, dodatak na skor je manji
	this.Score += (this.level/10)^this.Timer

	//Additionaly increment number of guessed nodes
	this.hideGuessedPair();
	
	if( this.NumberOfGuessedNodes == Object.keys(this.GameGrid).length ) this.theEnd();
}

MindGame.prototype.hideGuessedPair = function()
{
    this.NumberOfGuessedNodes += 2;
    this.clickQueue[0].style.opacity = 0;
    this.clickQueue[0].onclick = null;
    this.clickQueue[1].style.opacity = 0;
    this.clickQueue[1].onclick = null;
}
MindGame.prototype.theEnd = function(){
	clearInterval(TheTimeInterval);

}

function Theme(themeName, level, totalImages)
{
	
	this.Name = themeName;
	this.ThemeDirectory = "./theme" + "/" + this.Name + "/";
	this.Images = new Array();

	//Select a few pictures from repository
	var numArray = new Array(totalImages);
	for (var i=1; i<=totalImages; i++)  numArray[i]=i;

	for (var n=0, i = numArray.length; n<level; n++, i-- ) 
	{
		var rnd=null;

		// while!!faster responce makes rnd=undefined. This is avoidance of that.
		// removes radnomly selected image from next time search
		while(!(rnd)) {rnd = numArray.splice(Math.floor(Math.random() * (i + 1)), 1)[0];}

		rnd = ("0"+rnd).slice(-2); //two digits 0#
		this.Images[n] = new Image();
		this.Images[n].src = this.ThemeDirectory + "images/image_" + rnd + ".png"; //link file: "images_01.png"
	}
}
/**
 * @param {string} index The string
 */
Theme.prototype.getImage = function( index )
{
	return this.Images[index];
}
/**
 * @param {string} index The string
 */
Theme.prototype.getImageSrc = function ( index )
{
	if(!this.Images[index].src ) return index;
	return this.Images[index].src;  
}
Theme.prototype.getImageBackSrc = function()
{
	return this.ThemeDirectory + "images/image_00.png";
}
function GameManager()
{
	this.PlayerName = GameManager.getPlayerName();
	this.Level = GameManager.getLevel();
	this.MindGame = new MindGame(this.PlayerName, this.Level);
	this.Theme = new Theme("default", this.Level, 24);
	this.draw();
}
// function getCSSStyle( s )
// {
//     var ss = document.styleSheets;
//     for(var i=0; i<ss.length; i++)
//     {
//         var sIterator = ss[i];
//         for( var j=0; j<sIterator.cssRules.length;j++)
//         {
//             if(sIterator.cssRules[j].cssText.indexOf(s)>-1) return sIterator.cssRules[j];
//         }
//     }
// }

var styleMindGameNode;
var styleMindGame;

GameManager.prototype.draw = function()
{
	for(var i=1; i<=this.Level; i++)
		for(var j=1; j<=this.Level; j++)
		{
			var e = document.createElement('div');
			e.className = "MindGameNode diagonal click";
			e.id = ""+i+"-"+j+"";
			e.setAttribute('onclick', 'GameManager.clicked(event);');
			
			var e0=document.createElement('img');
			e0.src = this.Theme.getImageBackSrc();
			e0.className = "front";

            document.getElementById("MindGame").appendChild(e);
			e.appendChild(e0);
		}
}

//static methods
GameManager.getPlayerName = function(){ return document.getElementById("MGStartName").value; }
GameManager.getLevel = function(){  
	if(document.getElementById("rbEasy").checked) return 4;
	if(document.getElementById("rbMedium").checked) return 6;
	if(document.getElementById("rbHard").checked) return 8;
}

var TheGame;
GameManager.clicked = function(myEvent)
{
	var e = myEvent.target;
	while( !e.classList.contains("MindGameNode") ) e = e.parentNode;

	TheGame.MindGame.clicked(e);
}


function gameMindStart(){
	var eMGStart = (document.getElementById("MGMenu")).getElementsByClassName("MGStart")[0];
	var ePlayerName = document.getElementById("MGStartName")
	var ePlayerNameLabel = document.getElementById("MGStartNameLabel");
	if(ePlayerName.value == "")
	{
		ePlayerNameLabel.innerHTML = "Enter your name first";
		return;
	}
	else
		if(!eMGStart.classList.contains("page"))	
		{
			eMGStart.classList.add("next");
			ePlayerName.style.display = "none";
			ePlayerNameLabel.innerHTML = "Please select level";
			eMGStart.classList.add("page");
			var eRadioDivWrappers = document.getElementsByClassName("rbDivWrapper"); for(var i = 0; i<eRadioDivWrappers.length; i++) {eRadioDivWrappers[i].style.display="block";}
			return;
		}
		
	document.getElementById("MGMenu").style.visibility = "hidden";
	document.getElementById("MindGameScore").style.visibility = "visible";
	document.getElementById("MindGame").style.visibility = "visible";
    TheGame = new GameManager;
    TheTimeInterval = window.setInterval( function() { timer_click(); }, 1000);

}
 
function timer_click(){
	document.getElementById("MGscore").innerHTML = TheGame.MindGame.Score;
	document.getElementById("MGtimer").innerHTML = ++TheGame.MindGame.Timer + " sec";
	document.getElementById("MGclicks").innerHTML = TheGame.MindGame.Clicks;
}

function rbClick()
{
	var aud = document.getElementsByTagName("audio")[0];
	aud.play();
}

function MindGameScore_Move(){
	var mgs = document.getElementById("MindGameScore")
	mgs.right = mgs.right = 0?-1:0;
	
}
