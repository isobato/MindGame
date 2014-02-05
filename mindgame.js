GameManager.TheGame = null;
GameManager.eMGMenu = null;
GameManager.ePlayerName = null;
GameManager.ePlayerNameLabel = null;
GameManager.eMGStart = null;
function GameManager()
{
	_this = this;
	this.LevelsDictionary = {4:"easy", 6:"medium", 8:"hard"}
	this.PlayerName = GameManager.getPlayerName();
	this.Level = GameManager.getLevel();
	this.MindGame = new MindGame(this.PlayerName, this.Level, this);
	this.Theme = new Theme("default", this.Level, 24);
	this.draw();

}

GameManager.isPage1 = function(){return !GameManager.eMGStart.classList.contains('page2');}
GameManager.isPage1Complete = function() {
		if(GameManager.ePlayerName.value == '')
		{
			GameManager.ePlayerNameLabel.innerHTML = "Please enter your name first";
			return false;
		}

		return true;
	}
GameManager.showPage2 = function(){
		GameManager.eMGStart.classList.add('next');		//50% animation
		GameManager.ePlayerName.style.display = "none";
		GameManager.ePlayerNameLabel.innerHTML = "Please select level";

		document.getElementById("MGname").innerHTML = GameManager.ePlayerName.value;
		Theme.loadSound();
		
		//show radio buttons on second page
		var eRadioDivWrappers = document.getElementsByClassName("rbDivWrapper"); 
		for(var i = 0; i<eRadioDivWrappers.length; i++) {eRadioDivWrappers[i].style.display="block";}
	}
GameManager.gameStart = function(){
		GameManager.eMGMenu = document.getElementById("MGMenu");
		GameManager.ePlayerName = document.getElementById("MGPlayerName");
		GameManager.ePlayerNameLabel = document.getElementById("MGPlayerNameLabel");
		GameManager.eMGStart = GameManager.eMGMenu.getElementsByClassName("MGStart")[0];

		if( GameManager.isPage1() ){
			if( GameManager.isPage1Complete() ){
				GameManager.showPage2();
				GameManager.eMGStart.classList.add("page2");	//another 50% of animation
			}
			return;
		}
		else{
			//Page2 is showing, level selected and next button clicked
			document.getElementById("MGMenu").style.visibility = "hidden";
			document.getElementById("MindGameScore").style.visibility = "visible";
			document.getElementById("MindGame").style.visibility = "visible";
	    
	    	//Initiate the game
	    	GameManager.TheGame = new GameManager;
	    	TheTimeInterval = window.setInterval( function() { GameManager.TheGame.timer_tick(); }, 1000);
		}
	}
GameManager.rbClick = function(){ Theme.Sounds["guess"].play(); }

GameManager.getPlayerName = function(){ return document.getElementById("MGPlayerName").value; }
GameManager.getLevel = function(){  
		if(document.getElementById("rbEasy").checked) return 4;
		if(document.getElementById("rbMedium").checked) return 6;
		if(document.getElementById("rbHard").checked) return 8;
	}
GameManager.prototype.timer_tick = function(){
		document.getElementById("MGscore").innerHTML = this.MindGame.Score;
		document.getElementById("MGtimer").innerHTML = ++this.MindGame.Timer + "sec";
		document.getElementById("MGclicks").innerHTML = this.MindGame.Clicks;
	}

GameManager.prototype.clicked = function(myEvent){	this.MindGame.clicked( myEvent ); }
GameManager.prototype.draw = function()
{
	for(var i=1; i<=this.Level; i++)
		for(var j=1; j<=this.Level; j++)
		{
			var e = document.createElement('div');
			e.className = "MindGameNode diagonal click " + this.LevelsDictionary[this.Level];
			e.id = ""+i+"-"+j+"";
			e.onclick = function(){_this.clicked(this);};
			
			var e0=document.createElement('img');
			e0.src = this.Theme.getImageBackSrc();
			e0.className = "front";

            document.getElementById("MindGame").appendChild(e);
			e.appendChild(e0);
		}
}
GameManager.prototype.showElement = function(e)
{
	if(e.childNodes.length>1)   return;
	var e1=document.createElement('img');
	e1.src = this.Theme.getImageSrc(this.MindGame.GameGrid[e.id]);
	e1.className = "back";
	
	e.appendChild(e1);
	e.classList.add("reveal");
}
GameManager.prototype.hideElement = function(e)
{
	e.classList.remove("reveal");
	e.childNodes[1].remove();
}
GameManager.prototype.hideGuessedPair = function(e1, e2)
{
	e1.style.opacity = 0;
    e1.onclick = null;
    e2.style.opacity = 0;
    e2.onclick = null;
}


function MindGame(playerName, level, observer)
{
	// this.EventHideElement = null;
	// this.EventShowElement = null;
	// this.EventHideGuessedPair = null;
	this.GameManagerEventObserver = observer;

	this.PlayerName = playerName;
	this.Level = level;

	this.GameGrid = MindGame.scrambleArray(level);

    this.NumberOfGuessedNodes = 0;
	this.Clicks = 0;
	this.Score = 0;

	//"ct" - current timer stamp
	// 2pair guessed within 1 second bounus is 1013 etc.
	this.Bonus3 = {"ct":0, 1:1013, 2:503, 3:101};
	this.Timer = 0;
	this.clickQueue = new Array();
}
MindGame.scrambleArray = function(level){
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
	this.alertObserverShowElement(e);

	if(this.clickQueue.length > 1)
	{															//Second click registred
		if( this.clickQueue[0].id == this.clickQueue[1].id)
			this.alertObserverHideElement(this.clickQueue[0]);				//Same card clicked. Close it!
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
		this.alertObserverHideElement(this.clickQueue[0]); 
		this.alertObserverHideElement(this.clickQueue[1]);
	}
	catch(ex){}
    this.clickQueue.length = 0;
}
MindGame.prototype.score = function()
{
	var secPassed = this.Timer - this.Bonus3.ct;
	var isBonus = secPassed < 4 ? secPassed : 0;
	this.Score += 100 + (isBonus>0 ? this.Bonus3[isBonus] : 0);

	//Additionaly increment number of guessed nodes
	this.NumberOfGuessedNodes += 2;
	this.alertObserverHideGuessedPair();

	this.Bonus3.ct = this.Timer;
	
	if( this.NumberOfGuessedNodes == Object.keys(this.GameGrid).length ) this.theEnd();
}
MindGame.prototype.alertObserverHideElement = function(e){	this.GameManagerEventObserver.hideElement(e);	}
MindGame.prototype.alertObserverShowElement = function(e){	this.GameManagerEventObserver.showElement(e);	}
MindGame.prototype.alertObserverHideGuessedPair = function(){	this.GameManagerEventObserver.hideGuessedPair(this.clickQueue[0], this.clickQueue[1]);	}
MindGame.prototype.theEnd = function()
{
	clearInterval(TheTimeInterval);
	GameManager.timer_tick();	//Collect score and show last 
	
	//GameNOdes are invisible and they are taking space. This frees that space
	var gameNodes = document.getElementById("MindGame").getElementsByClassName("MindGameNode")
	for(i=0; i<gameNodes.length;i++) gameNodes[i].style.display="none";;

	var stovariste = new MindGameStorage(this.Level);
	var data = {"player": this.PlayerName, "score": this.Score, "timer": this.Timer, "clicks": this.Clicks};
	var rank = stovariste.checkRank(data);
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
Theme.Sounds = [];
Theme.Directory = './theme/';

Theme.loadSound = function(){
	var audiosounds = {'open':0, 'close':0, 'guess':0};
	var soundsDir = Theme.Directory + MindGameStorage.getTheme() + '/sounds/';
	for(k in audiosounds)
		Theme.Sounds[k] = new Audio(soundsDir + k + '.mp3');
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

///
///ViewScoreTable class
///
function ViewScoreTable()
{
	//Parent of Score Table
	this.Tbl = document.getElementById("MindGame");
	//Element to be cloned
	this.DollySheep = document.getElementById("MindGameScore");
}
ViewScoreTable.postFb = function(){
	FB.ui(
    {
            method: 'feed',
            name: 'Igra memorije',
            caption: 'Igraj se memorije',
			description:( '' + TheGame.MindGame.Score + 'poena za ' + TheGame.MindGame.Timer + ' sekuni sa ' +TheGame.MindGame.Clicks+' klikova!'),
            link: 'http://isobato.github.io/MindGame/',
            picture: 'http://isobato.github.io/MindGame/theme/logo.jpg'
    },
    function(response){
    	if (response && response.post_id) {
    		alert("Vaš rezultat ima status: Shared");
    	}
    	else
    	{
    		alert("Niste uspeli da podelite svoj rezultat");
    	}
    }
    );
}
ViewScoreTable.postTw = function(){
    var url = 'https://twitter.com/intent/tweet?text='
    url += 'I played memory game and score ' + TheGame.MindGame.Score + ' in ' + TheGame.MindGame.Clicks + ' clicks within ' + TheGame.MindGame.Timer + ' sec!! ';
    url += 'The memory game is on this link: http://isobato.github.io/MindGame/';
    window.open(url, "Twit my score",'height=290,width=320');
}
ViewScoreTable.setChildren = function(e, data, rank) {
	e.className="Tbl";
	e.setAttribute("rank", rank);
	e.children.namedItem("MGname").innerHTML = data.player;
	e.children.namedItem("MGscore").innerHTML = data.score;
	e.children.namedItem("MGtimer").innerHTML = data.timer;
	e.children.namedItem("MGclicks").innerHTML = data.clicks;
	return e;
}
//Simple draw method without animation
//<allNodes>table containing 1 to max elements.
ViewScoreTable.prototype.draw = function(allNodes, rank)
{
	var anim = "sortingAnimation";	//name of the CSS style class to be added
	var curr = "currentScore";
	//Run animation on elements precending rank position element
	allNodes[rank].classList.add(curr);
}

ViewScoreTable.prototype.postMessage = function(new_data_rank, new_data, table)
{
	if( new_data_rank < 0 )	//Does not have local storage
	{return;}

	var allNodes = [];
	for(i=0; i<table.length; i++)
	{
		allNodes[i] = ViewScoreTable.setChildren(this.DollySheep.cloneNode(true), table[i], i);
		//Add it
		this.Tbl.appendChild(allNodes[i]);
	}
	
	if( new_data_rank < MindGameStorage.maxrows() )	//local storage ON and rank good
	{
		this.draw(allNodes, new_data_rank);
	}
	else 	//Local storage ON and bad rank
	{}
	var buttonFb = document.createElement("button"); buttonFb.id="fb"; buttonFb.className = "buttonPost"; buttonFb.setAttribute('onclick', 'ViewScoreTable.postFb()');
	var buttonTw = document.createElement("button"); buttonTw.id="tw"; buttonTw.className = "buttonPost"; buttonTw.setAttribute('onclick', 'ViewScoreTable.postTw()');
	var pElement = document.createElement("p"); pElement.innerHTML = "Share your result on <br> Facebook and Twitter";

	this.Tbl.appendChild(buttonFb);
	this.Tbl.appendChild(buttonTw);
	this.Tbl.appendChild(pElement);
}
///
///MindGameStorage class
///
function MindGameStorage(level){
	var stringl = {4:"easy", 6:"medium", 8:"hard"};
	this.LevelS = stringl[level];

	this.Observer = new ViewScoreTable();
	this.Table = null;
	this.NewDataRank = null;
	this.NewData = null;
}
//Static const
MindGameStorage.maxrows = function(){
	return 10;
}
MindGameStorage.HasHTML5Storage = function(){
	try {   return 'localStorage' in window && window['localStorage'] !== null;  } 
	catch (e) { return false; };
}
//Data Structure x3 {easy, medium, hard}
MindGameStorage.newMGSrow = function() { 
	return (	{"player":"", "score":0, "timer":0, "clicks":0, "fb":false, "tw":false}		);
}
MindGameStorage.read = function(level) {
	var tbl = [];
	var i = 0;
	
	//Get first key from structure used for storing the data
	var firstkey;	
	for(firstkey in MindGameStorage.newMGSrow()) break;


	while(	localStorage.getItem(level + "." + i + "." + firstkey)!==null && 
			localStorage.getItem(level + "." + i + "." + firstkey)!==undefined )
	{
		var r = MindGameStorage.newMGSrow();
		for(key in r)
			switch(key){
				case "player": r[key] = localStorage[level + "." + i + "." + key]; break;
				case "fb":
				case "tw": r[key] = !! localStorage[level + "." + i + "." + key]; break;
				default: r[key] = parseInt(localStorage[level + "." + i + "." + key]); 
			}
		tbl[i++]=r;
	}

	return tbl;
}
MindGameStorage.write = function(table, level) {
	for(i=0; i<table.length; i++)
	{
		for(key in table[i])
			localStorage[level + "." + i + "." + key] = table[i][key];
	}
}
MindGameStorage.getTheme = function(){
	var themeName = 'default';
	if( MindGameStorage.HasHTML5Storage() ){
		var t = localStorage["themeName"];
		if( t !== null && t!==undefined ) themeName = t;
	}
	return themeName;
}
MindGameStorage.prototype.addAndRank = function(player, score, timer, clicks)
{
	var r = MindGameStorage.newMGSrow();
	r.player = player;	r.score=score;	r.timer=timer;	r.clicks=clicks;	r.fb=false;	r.tw=false;
	
	if(!this.Table) this.Table = [];	//ensure not empty
	var rank = 0;
	while( rank < this.Table.length && score <= this.Table[rank].score) 
		if(score == this.Table[rank].score){
			if(timer == this.Table[rank].timer)	{
				if(cliks > this.Table[rank].clicks) rank++;
			}
			else if(timer > this.Table[rank].timer) rank++;	
		}
		else
			rank++;
	this.Table.splice(rank, 0, r);
	if( this.Table.length > MindGameStorage.maxrows()) this.Table.length = MindGameStorage.maxrows();	//ensure max length
	return rank;
}
MindGameStorage.prototype.readStorage = function()
{
	return this.Table = MindGameStorage.read(this.LevelS); 
}
MindGameStorage.prototype.writeStorage = function()
{	//Static func write <level>.#.<field> data
	MindGameStorage.write(this.Table, this.LevelS);
}
MindGameStorage.prototype.checkRank = function(data)
{
	if( ! MindGameStorage.HasHTML5Storage() ) return this.alertObserverNoStorage(); //returns 0;
	this.readStorage();

	var rank = this.addAndRank(data.player, data.score, data.timer, data.clicks);
	if(rank < MindGameStorage.maxrows())
	{
		this.NewDataRank = rank;
		this.NewData = data;

		//Alert before Table is changed because of possible animation
		this.alertObserverRanked();
		this.writeStorage();		
	}
	else
	{
		this.alertObserverNotRanked();
	}
	return rank;	
}
MindGameStorage.prototype.alertObserverNoStorage = function(){	this.Observer.postMessage(-1); return -1; }
MindGameStorage.prototype.alertObserverRanked = function(){ 	this.Observer.postMessage(this.NewDataRank, this.NewData, this.Table);	}
//returns # > rank could be
MindGameStorage.prototype.alertObserverNotRanked = function(){	this.Observer.postMessage(MindGameStorage.maxrows()); }