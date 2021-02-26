global tasklist, copytasklist, completed, setup-value 


//Active page button, timer, and progress bar 
const activebutton = document.getElementById('pomo-button');
const activetimer = document.getElementById('timer');
const activebar = document.getElementById('progress-bar');
const barwidth = 600; //600px in style.css
const breaktitle = document.getElementById("break-title");

//Break page button and timer
const breakbutton = document.getElementById('break-button');
const breaktimer = document.getElementById('break-timer');

//Sounds for both active and break page
const tick = document.getElementById('tick');
const click = document.getElementById('click');
const beep = document.getElementById('beep');



//timer variables
var activetime = 8; //should be set to pomodoro timer (1500s/ 1800s/ 2100s) == (25mins/ 30mins/ 35mins)
var shortbreaktime = 5; // should be set to break time (5mins /)
var longbreaktime = 10;
var counter = activetime; 
var state;
var longbreakcounter = 0; // by default, after 4 short breaks, a long break will occur (when set to 3)

/*function that set up timer based on user's set-up values.
(default timer/counter is 8,) (default shortbreaktime = 5, default longbreaktime = 10)
*/
function set_time(){   
    console.log(setup_value);
    if(setup_value[0]==''){
        activetime=8;
    }
    else{
        activetime = 60 * setup_value[0];
    }
    if(setup_value[2]==''){
        shortbreaktime = 5;
    }
    else{
        shortbreaktime = 60 * setup_value[2];
    }
    if(setup_value[3]==''){
        longbreaktime  = 0;
    }
    else{
        longbreaktime  = 60 * setup_value[3];
    }
}

/**
 *  Variables to keep track of tasks:
 *  store how many pomos you spend on a task
 *  During break page, check off tasks is stored completetask
 *  After break page, checked off task is moved to actualpomo
 */
let actualpomo = {};
let pomocount = 0;
let currTask;
let completedtask = [];

//warning variable, bool for warning prompt when clicking on abort, second click will abort pomo
let abortClicked = false;

//used to update actual pomo when aborting out of break page
let abortBreak = false;


/**
 *  Clicking on abort button on active page will first warn the user
 *  that aborting will end the session. Second click on abort will
 *  end the timer and redirect to results page
 */
activebutton.addEventListener('click', ()=>{
    if (abortClicked) {
        actualpomo[currTask] = pomocount;
        abortTimer();
    }
    else {
        alert("Abort will end all pomo sessions, click again if you want to continue");
        abortClicked = true;
    }
});

/**
 *  Clicking on abort button on break page will first warn the user
 *  that aborting will end the session. Second click on abort will
 *  end the timer, update the task list (how many pomos are spent on the task) for
 *  local storage, and redirect to results page
 */
breakbutton.addEventListener('click', ()=>{
    if (abortClicked) {
        actualpomo[currTask] = pomocount;
        abortBreak = true;
        redirectToPage("break");
    }
    else {
        alert("Abort will end all pomo sessions, click again if you want to continue");
        abortClicked = true;
    }
});

/**
 *  Increments pomocount everytime user reach break page and 
 *  resets pomocount when user checks off at least one task in break page.
 *  Sets timer to count down in active and break page
 *  Once timer reaches zero, either redirect to active or break page if there are still tasks left or
 *  if there is no more tasks, redirect to results page
 */
function startTimer(page){
    let task = tasklist[0] ? tasklist[0][0] : false;
    if (page == "break") {
        pomocount++;
    }
    else {
        if (completedtask.length){
            for (const task of completedtask){ actualpomo[task] = pomocount/completedtask.length; }
            pomocount = 0;
            completedtask = [];
        }
        currTask = task;
    }
    page == "active" && (task && !abortBreak) ? document.getElementById("first-task").textContent = "Task: " + task : task && !abortBreak ? false : abortTimer();
    click.play();
    reset(page);
    updateCounter(page);
    state = setInterval(()=>{
        counter -= 1;
        counter == 0 ? redirectToPage(page) : (counter < 6 ? tick.play() : false);
        if (page == "active"){
            activebar.style.width = ((barwidth*counter)/activetime).toString() + "px";
            updateCounter("active");
        }
        else updateCounter("break");
    },1000);
}

/**
 *  Function used in startTimer to redirect to active or break page. If came from active page
 *  hide active page and transition to break page. Else if came from break page hide break page,
 *  remove all tasks that are checked off from task list, and transition to active page.
 */
function redirectToPage(curPage){
    clearInterval(state);
    beep.play();
    setTimeout(function(){ 
        if (curPage == "active"){
            document.getElementById("active-page").style.display = "none";
            document.getElementById("break-page").style.display = "inline";
            document.getElementById("to-break-page").click();
            startTimer("break");
        }
        else if (curPage == "break"){
            for (let i = 0; i < tasklist.length; i++){
                if (completed.includes(tasklist[i][0])){
                    let task = document.getElementById('break-task-container').children[i+1];
                    if (task) document.getElementById('break-task-container').children[i+1].remove();
                    completedtask.push(tasklist[i][0]);
                    tasklist.splice(i--, 1);
                }
            }
            document.getElementById("active-page").style.display = "inline";
            document.getElementById("break-page").style.display = "none";
            startTimer("active");
            document.getElementById("to-active-page").click();
        }
    }, 500);
}

/**
 *  Used in startTimer to display timer countdown on html title and timer p element.
 */
function updateCounter(page){
    let mins = Math.floor(counter / 60);
    let secs = counter % 60;
    mins = mins < 10 ? "0" + parseInt(mins) : parseInt(mins);
    secs = secs < 10 ? "0" + parseInt(secs) : parseInt(secs);
    if (page == "active"){
        activetimer.innerHTML = mins + ":" + secs;
        document.title = mins + ":" + secs + " Active Timer";
    }
    else if (page == "break"){
        breaktimer.innerHTML= mins + ":" + secs;
        document.title = mins + ":" + secs + " Break Timer";
    }
}

/**
 *  Function used in startTimer to reset timer variables, 
 *  warning variable and progress bar.
 */
function reset(page){
    state = null;
    if (page == "active") counter = activetime;
    else {
        if (longbreakcounter >= 3) {
            longbreakcounter = 0;
            counter = longbreaktime;
            breaktitle.textContent = "Long Break";
        }
        else {
            longbreakcounter++;
            counter = shortbreaktime;
            breaktitle.textContent = "Short Break";
        }
    }
    abortClicked = false;
    activebar.style.width = "600px";
}

/**
 *  Function used in startTimer when all tasks are completed or button when 
 *  user clicks abort. It will save data to local storage in JSON format 
 *  and redirect user to results page.
 */
function abortTimer(){
    clearInterval(state);
    beep.play();
    let output = [];
    for (let i = 0; i < copytasklist.length; i++){
        let objTask = {};
        objTask.id = i;
        objTask.expectedpomos = copytasklist[i][1];
        objTask.actualpomos = actualpomo[copytasklist[i][0]] ? actualpomo[copytasklist[i][0]] : 0;
        objTask.currrenttask = copytasklist[i][0] == currTask;
        objTask.completed = completed.includes(copytasklist[i][0]) ? true : false;
        objTask.taskdescription = copytasklist[i][0];
        output.push(objTask);
    }
    window.localStorage.setItem("tasks", JSON.stringify(output)); 
    document.getElementById("active-page").style.display = "none";
    document.getElementById("break-page").style.display = "none";
    document.location.replace('../HTML/results-page.html');
    
}

module.exports = {startTimer, redirectToPage, updateCounter, reset, abortTimer};
