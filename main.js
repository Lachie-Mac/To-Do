// Lachlan Hamish Macdougall - started: 29/5/2021 - last updated: 27/8/2021
// Date system works within years 2000 - 2100

"use strict";

// CLASSES ---------------------------------------------------------------------------------------------------------------------------------------------------

class Subtask
{
    constructor(description)
    {
        this.description = description;
        this.checked=false;
    }
    // No getters and setters bc data is public
    // From Data
    fromData(data)
    {
        this.description = data.description;
        this.checked = data.checked;
    }
}

class Task
{
    constructor(description)
    {
        this.description=description;
        this.dueDate=""; // use Date.toString() to set this for parsing later on
        this.checked=false;
        this.subtaskArray = [];
        this.repetition = {id: null,
                           frequency: "",
                          };
        this.closed = undefined; // undefined = false
    }
    // No getters and setters bc data is public
    // From Data

    get subtasks()
    {
        return this.subtaskArray.length;
    }

    fromData(data)
    {
        this.description = data.description;
        this.dueDate = data.dueDate;
        this.checked = data.checked;
        this.repetition = data.repetition;
        this.closed = data.closed;
        for(let i=0;i<data.subtaskArray.length;i++)
        {
            let newSubtask = new Subtask;
            newSubtask.fromData(data.subtaskArray[i]);
            this.subtaskArray.push(newSubtask);
        }
    }
}

class Day
{
    constructor()
    {
        this.taskArray = [];
    }
    // accessor dayArray[i].height
    get height()
    {
        return this.taskArray.length;
    }

    fromData(data)
    {
        for(let i=0;i<data.taskArray.length;i++)
        {
            let newTask = new Task();
            newTask.fromData(data.taskArray[i]);
            this.taskArray.push(newTask);
        }
    }
}

// CLASS MODIFIER FUNCTIONS ----------------------------------------------------------------------------------------------------------------------------------

// The below function checks to see if data exists and returns true if it does
function checkIfDataExistsLocalStorage()
{
    let dataExists = false;

    let data = localStorage.getItem(DATA_KEY);

    if( typeof(data) !== "undefined"
        && data != null
        && data != undefined
        && data != "undefined"
        && data !== "")
    {
        dataExists = true;
    }

    return dataExists;
}

// The below function updates local storage with data given in the parameter
function updateLocalStorage(data) // passes in dayArray, but repetitionCount also needs ot be stored
{
    let dataForStoring = {arrayStorage: data,
                          countStorage: repetitionCount}
    localStorage.setItem(DATA_KEY,JSON.stringify(dataForStoring));
    return;
}

// The below function retrieves data from local storage and parses it back to object before returning it
function getDataLocalStorage()
{
    return JSON.parse(localStorage.getItem(DATA_KEY));
}

// function fills out days to ensure 366 days ahead in memory
function updateBuffer()
{
    for(let i=indexFirstEmptyDay;i<=indexCurrentDay+366;i++)
    {
        let newDay = new Day(i);
        dayArray.push(newDay);
    }

    return;
}

// adds task or sub task to memory and updates page accordingly
// NOTE: DISTINGUISHES between NEW TASKS and OVERWRITING by using false instead of (null or 0 upwards).
function addTask(dayIndex,taskIndex,subtaskIndex)
{
    let textArea = document.getElementById(`input-${dayIndex}-${taskIndex}-${subtaskIndex}`);
    // removing occasional enter character
    let textString = textArea.value.replace(/(\r\n|\n|\r)/gm, "");

    // adding new task to a day
    if(taskIndex===false)
    {
        let newTask = new Task(textString);
        dayArray[dayIndex].taskArray.push(newTask);
    }
    // adding a new subtask to a task on a given day
    else if(subtaskIndex===false)
    {
        let newSubtask = new Subtask(textString);
        // ensure parent task is not closed
        dayArray[dayIndex].taskArray[taskIndex].closed = false; 
        // if parent task is checked, make child checked
        if(dayArray[dayIndex].taskArray[taskIndex].checked)
        {
            newSubtask.checked = true;
        }
        dayArray[dayIndex].taskArray[taskIndex].subtaskArray.push(newSubtask);

    }
    // overwriting to specific task
    else if(subtaskIndex==null)
    {
        dayArray[dayIndex].taskArray[taskIndex].description=textString;
    }
    // overwriting specific subtask
    else
    {
        dayArray[dayIndex].taskArray[taskIndex].subtaskArray[subtaskIndex].description=textString;
    }

    // clearing textarea
    textArea.value = "";

    // updating tasks on page & local storage
    updateTasks(dayIndex,dayIndex+1);
        // remove defer in mdl src on html for this to work
        componentHandler.upgradeDom();
    updateLocalStorage(dayArray);

    // focusing on add subtask box so entry can continue if its a new one
    if(subtaskIndex===false&&taskIndex!==false)
    {
        document.getElementById(`input-${indexFocus.day}-${indexFocus.task}-false`).focus();
    }

    // resetting height of addtask box of given day if necessary
    if(taskIndex===false)
    {
        textareaExpand(dayIndex,false,false);
    }

    return;
}

// handles strikethrough by altering checked state in memory and reloading relevant task
function boxChecked(dayIndex,taskIndex,subtaskIndex)
{
    let playSound = false;
    if(subtaskIndex==null) // toggling task checked value and all its subtasks
    {
        // toggling task checked
        dayArray[dayIndex].taskArray[taskIndex].checked = !(dayArray[dayIndex].taskArray[taskIndex].checked);
        playSound = dayArray[dayIndex].taskArray[taskIndex].checked;

        // toggling all subtasks to match that check
        for(let i=0;i<dayArray[dayIndex].taskArray[taskIndex].subtaskArray.length;i++)
        {
            dayArray[dayIndex].taskArray[taskIndex].subtaskArray[i].checked = dayArray[dayIndex].taskArray[taskIndex].checked;
        }
    }
    else // toggling subtask checked value
    {
        dayArray[dayIndex].taskArray[taskIndex].subtaskArray[subtaskIndex].checked = !(dayArray[dayIndex].taskArray[taskIndex].subtaskArray[subtaskIndex].checked);
        playSound = dayArray[dayIndex].taskArray[taskIndex].subtaskArray[subtaskIndex].checked;
    }

    // updating tasks on page & local storage
    updateTasks(dayIndex,dayIndex+1);
        // remove defer in mdl src on html for this to work
        componentHandler.upgradeDom();
    updateLocalStorage(dayArray);

    // playing sound if ticking
    if(playSound)
    {
        let congrats = new Audio('tick.mp3');
        congrats.volume = 0.04;
        congrats.play();
    }

    return;
}

// handles single click on task elements by giving option to add subtasks
function focusOn(dayIndex,taskIndex,subtaskIndex)
{
    let oldDay = JSON.parse(JSON.stringify(indexFocus.day));

    // storing focused index
    indexFocus.day = dayIndex;
    indexFocus.task = taskIndex;
    indexFocus.subtask = subtaskIndex;

    // updating day of focus so long as it isn't null
    if(indexFocus.day!=null)
    {
        updateTasks(dayIndex, dayIndex+1);
    }
    // updating old day of focus so long as it isn't null
    if(oldDay!=null)
    {
        updateTasks(oldDay, oldDay+1);
    }
        // remove defer in mdl src on html for this to work
        componentHandler.upgradeDom();
    return;
}

// moves focused task/subtask in memory according to onscreen height etc
function move(direction)
{
    let day = indexFocus.day;
    let task = indexFocus.task;
    let subtask = indexFocus.subtask;
    let moveDirection = 0;

    // task movement
    if(subtask==null)
    {

        if(direction=="up"&&task!=0) // up and not at top
        {
            // swapping upward
            let swap = dayArray[day].taskArray[task-1];
            dayArray[day].taskArray[task-1]=dayArray[day].taskArray[task];
            dayArray[day].taskArray[task]=swap;
            // altering focus to match
            indexFocus.task--;
        }
        else if(direction=="down"&&task!=(dayArray[day].taskArray.length-1)) // down and not at bottom
        {
            // swapping downward
            let swap = dayArray[day].taskArray[task+1];
            dayArray[day].taskArray[task+1]=dayArray[day].taskArray[task];
            dayArray[day].taskArray[task]=swap;
            // altering focus to match
            indexFocus.task++;
        }
        else if(direction=="left"&&day!=0) // left and not at leftmost
        {
            if(task<(dayArray[day-1].taskArray.length)) // checking that day on left has at least as many tasks to maintain height
            {
                // adding to left day at same height
                dayArray[day-1].taskArray.splice(task,0,dayArray[day].taskArray[task]);

                // remove from current day
                dayArray[day].taskArray.splice(task,1);
            }
            else // if not, just push to bottom of next
            {
                dayArray[day-1].taskArray.push(dayArray[day].taskArray[task]);

                // remove from current day
                dayArray[day].taskArray.splice(task,1);

                // alter focus task index to bottom of day before
                indexFocus.task = dayArray[day-1].taskArray.length-1;
            }

            // altering focus to match
            indexFocus.day--;

            moveDirection=-1;
        }
        else if(direction=="right"&&day!=(dayArray.length-1)) // right and not at rightmost
        {
            if(task<(dayArray[day+1].taskArray.length)) // checking that day on right has at least as many tasks to maintain height
            {
                // adding to right day at same height
                dayArray[day+1].taskArray.splice(task,0,dayArray[day].taskArray[task]);

                // remove from current day
                dayArray[day].taskArray.splice(task,1);
            }
            else // if not, just push to bottom of next
            {
                dayArray[day+1].taskArray.push(dayArray[day].taskArray[task]);

                // remove from current day
                dayArray[day].taskArray.splice(task,1);

                // alter focus task index to bottom of day before
                indexFocus.task = dayArray[day+1].taskArray.length-1;
            }

            // altering focus to match
            indexFocus.day++;

            moveDirection = 1;
        }


    }

    // subtask movement
    else if(indexFocus.subtask!=null)
    {
        if(direction=="up"&&subtask!=0) // up and not at top
        {
            // swapping upward
            let swap = dayArray[day].taskArray[task].subtaskArray[subtask-1];
            dayArray[day].taskArray[task].subtaskArray[subtask-1]=dayArray[day].taskArray[task].subtaskArray[subtask];
            dayArray[day].taskArray[task].subtaskArray[subtask]=swap;
            // altering focus to match
            indexFocus.subtask--;
        }
        else if(direction=="down"&&subtask!=dayArray[day].taskArray[task].subtaskArray.length-1) // down and not at bottom
        {
            // swapping downward
            let swap = dayArray[day].taskArray[task].subtaskArray[subtask+1];
            dayArray[day].taskArray[task].subtaskArray[subtask+1]=dayArray[day].taskArray[task].subtaskArray[subtask];
            dayArray[day].taskArray[task].subtaskArray[subtask]=swap;
            // altering focus to match
            indexFocus.subtask++;
        }
    }

    // updating tasks on page & local storage
    updateTasks(indexFocus.day-2,indexFocus.day+2);
        // remove defer in mdl src on html for this to work
        componentHandler.upgradeDom();
    updateLocalStorage(dayArray);

    // moving repetition if one exists for this task
    let repetition = dayArray[indexFocus.day].taskArray[indexFocus.task].repetition
    if(moveDirection!=0&&repetition!=undefined)
    {
        if(repetition.id!=null&&repetition.frequency!="")
        {
            updateRepetition(moveDirection);
        }
    }

    // scrolling moved task into view if it exists
    if(indexFocus.task!=null)
    {
        document.getElementById(`task-container-${indexFocus.day}-${indexFocus.task}-null`).scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
    }

    return;
}

// removes selected task/subtask
function removeFocused()
{
    let dayOfRemove = indexFocus.day;

    if(indexFocus.subtask==null) // deleting a task
    {
        // removing focused task
        dayArray[indexFocus.day].taskArray.splice(indexFocus.task,1);

        // moving focus up if at bottom and higher tasks exist
        if(indexFocus.task>0
           &&dayArray[indexFocus.day].taskArray.length==indexFocus.task) // if there's a task above it and none below the deleted task
        {
            indexFocus.task--; // move focus up one
        }

        // removing focus if no next task
        else if(dayArray[indexFocus.day].taskArray.length<2)
        {
            indexFocus.task = null;
            indexFocus.subtask = null;
        }
    }
    else if(indexFocus.subtask!=null)// deleting a subtask
    {
        // removing focused subtask
        dayArray[indexFocus.day].taskArray[indexFocus.task].subtaskArray.splice(indexFocus.subtask,1);

        // moving focus up if at bottom and higher subtasks exist
        if(indexFocus.subtask>0
           &&dayArray[indexFocus.day].taskArray[indexFocus.task].subtaskArray.length==indexFocus.subtask) // if there's a subtask above it and none below the deleted subtask
        {
            indexFocus.subtask--; // move focus up one
        }

        // removing focus if no next subtask
        else if(dayArray[indexFocus.day].taskArray[indexFocus.task].subtaskArray.length<2)
        {
            indexFocus.subtask = null;
        }
    }

    // updating tasks on page & local storage
    updateTasks(dayOfRemove,dayOfRemove+1);
        // remove defer in mdl src on html for this to work
        componentHandler.upgradeDom();
    updateLocalStorage(dayArray);

    return;
}

function updateFocusedDueDate()
{
    let newDayDate = document.getElementById("date1").value;
    let newMonth = document.getElementById("date2").value;
    let newYear = document.getElementById("date3").value;

    // if any are empty, remove due date
    if(newDayDate==""||newMonth==""||newYear=="")
    {
        dayArray[indexFocus.day].taskArray[indexFocus.task].dueDate="";
    }
    // if all full, set new due date to in focus task
    else
    {
        // handling input to Date object input conversion
        newDayDate = Number(newDayDate);
        newMonth = (Number(newMonth)) - 1;
        newYear = (Number(newYear))+2000;

        // setting new due date
        let newDueDate = new Date(newYear,newMonth,newDayDate);
        dayArray[indexFocus.day].taskArray[indexFocus.task].dueDate=newDueDate.toString();
    }

    let dayOfRemove = indexFocus.day;

    // removing focus
    indexFocus.day = null;
    indexFocus.task = null;
    indexFocus.subtask = null;

    // updating focused tasks container on page and local storage
    updateTasks(dayOfRemove,dayOfRemove+1);
        // remove defer in mdl src on html for this to work
        componentHandler.upgradeDom();
    updateLocalStorage(dayArray);

    return;
}

// moveDirection is 0 if not moved, -1 for a move to the left, and 1 for a move to the right (called after move occurs)
function updateRepetition(moveDirection)
{
    // if no repetition previously existed add one to task
    if(dayArray[indexFocus.day].taskArray[indexFocus.task].repetition==undefined)
    {
        dayArray[indexFocus.day].taskArray[indexFocus.task].repetition = {id: null,
                                                                            frequency: "",
                                                                        };
    }

    let daysWithChange=[];

    // if a repetition currently exists (id isn't null and frequency isnt "") remove future days
    let currentId = dayArray[indexFocus.day].taskArray[indexFocus.task].repetition.id;
    let frequency = dayArray[indexFocus.day].taskArray[indexFocus.task].repetition.frequency;
    let futureOnly = true; // deletes only future days unless in a move process
    if(moveDirection!=0) // if moving, find all days
    {
        futureOnly = false;
    }
    let daysOfDeletion = [];
    if(currentId!=null&&frequency!="")
    {
        let targetDays = generateRepetitionRule(indexFocus.day-moveDirection,Number(frequency),futureOnly);
        daysWithChange = daysWithChange.concat(targetDays);

        for(let i=0;i<targetDays.length;i++)
        {
            for(let j=0;j<dayArray[targetDays[i]].taskArray.length;j++)
            {
                if(dayArray[targetDays[i]].taskArray[j].repetition!=undefined) //if task is not connect to a repetition, rep attribute may not exist
                { 
                    if(dayArray[targetDays[i]].taskArray[j].repetition.id==currentId)
                    {
                        dayArray[targetDays[i]].taskArray.splice(j,1);
                        daysOfDeletion.push(targetDays[i]);
                    }
                }
            }
        }
    }

    let furthestBackFound = Math.min(...daysOfDeletion);
    furthestBackFound = furthestBackFound + moveDirection; //as this will handle the -moveDirection from earlier

    if(currentId==null) // generate a new id based on global variable
    {
        dayArray[indexFocus.day].taskArray[indexFocus.task].repetition.id = repetitionCount;
        repetitionCount++;
    }

    if(moveDirection==0)
    {
        // update storage with frequency and a repetition id
        dayArray[indexFocus.day].taskArray[indexFocus.task].repetition.frequency = `${document.getElementById("repeatFrequency").value}`;
    }

    // generate new days only in the future based on updated storage
    futureOnly = true;
    let taskReplicated = dayArray[indexFocus.day].taskArray[indexFocus.task];
    let relevantDay = indexFocus.day;
    if(moveDirection!=0&&furthestBackFound<indexFocus.day) // if moving also move those that are behind 
    {
        relevantDay = furthestBackFound-dayArray[indexFocus.day].taskArray[indexFocus.task].repetition.frequency;
    }
    if(dayArray[indexFocus.day].taskArray[indexFocus.task].repetition.frequency!="")
    {
        let targetDays = generateRepetitionRule(relevantDay,Number (dayArray[indexFocus.day].taskArray[indexFocus.task].repetition.frequency),futureOnly);
        daysWithChange = daysWithChange.concat(targetDays);
        for(let i=0;i<targetDays.length;i++)
        {
            if(targetDays[i]!=indexFocus.day)
            {
                // creating new unlinked duplicate task for each and every entry
                let unlinkedTask = new Task;
                unlinkedTask.checked = false; // all generated tasks are unchecked
                unlinkedTask.dueDate = JSON.parse(JSON.stringify(taskReplicated.dueDate));
                unlinkedTask.description = JSON.parse(JSON.stringify(taskReplicated.description));
                unlinkedTask.repetition = JSON.parse(JSON.stringify(taskReplicated.repetition));
                unlinkedTask.subtaskArray = JSON.parse(JSON.stringify(taskReplicated.subtaskArray));

                // closed may or may not have been implemented for this task yet
                if(taskReplicated.closed==undefined)
                {
                    unlinkedTask.closed = undefined;
                }
                else
                {
                    unlinkedTask.closed = JSON.parse(JSON.stringify(taskReplicated.closed));
                }

                dayArray[targetDays[i]].taskArray.push(unlinkedTask);
            }
        }
    }

    // removing duplicates from daysWithChange
    daysWithChange = Array.from(new Set(daysWithChange));
    
    // update storage with new tasks and redisplay
    updateLocalStorage(dayArray);
    for(let i=0;i<daysWithChange.length;i++)
    {
        updateTasks(daysWithChange[i],daysWithChange[i]+1)
    }
        // remove defer in mdl src on html for this to work
        componentHandler.upgradeDom();    
    return;
}

function toggleDrawer(day,task)
{
    // handling undefined storage issues
    if(dayArray[day].taskArray[task].closed==undefined)
    {
        dayArray[day].taskArray[task].closed = false;
    }

    // toggling drawer state in storage
    dayArray[day].taskArray[task].closed = !(dayArray[day].taskArray[task].closed);

    // getting drawer state from storage and setting max-height and innerButtonString
    let innerButtonString = "remove";
    let newMaxHeight = "500000px";
    if(dayArray[day].taskArray[task].closed)
    {
        innerButtonString = "add";
        newMaxHeight = "0px";
    }

    // applying toggle changes to button
    document.getElementById(`expander-${day}-${task}-null`).innerText = innerButtonString;

    // animating drawer
    document.getElementById(`subtask-container-${day}-${task}-null`).style.maxHeight = newMaxHeight;

    // updating storage
    updateLocalStorage(dayArray);
}

// PARSE/STRING FUNCTIONS -------------------------------------------------------------------------------------------------------------------------------------------

function generateRepetitionRule(startDayIndex, frequency, futureOnly) // generated array doesn't include starting day
{
    let repRule = [];

    // simply add frequency to starting index
    for(let i=startDayIndex+frequency;i<dayArray.length;i=i+frequency)
    {
        repRule.push(i);
    }
    if(!futureOnly) // only add days in the past if required
    {
        for(let i=startDayIndex-frequency;i>=0;i=i-frequency)
        {
            repRule.push(i);
        }
    }

    return repRule;
}

// strips id -no.-no.-no. to extract numbers/nulls by locating -
function idStripper(string)
{
    let dashIndexes = [];
    let data = {day: null, task: null, subtask: null};

    // identifying dash locations
    for(let i=0;i<string.length;i++)
    {
        if(string.substring(i,i+1)=="-")
        {
            dashIndexes.push(i);
        }
    }

    // grabbing values from string
    data.day = parseInt(string.substring((dashIndexes[0])+1,dashIndexes[1]), 10);
    data.task = parseInt(string.substring((dashIndexes[1])+1,dashIndexes[2]), 10);
    data.subtask = parseInt(string.substring((dashIndexes[2])+1,dashIndexes[string.length]), 10);

    // handling NaN's from nulls - making them nulls
    if(string.substring((dashIndexes[1])+1,dashIndexes[2])=="null"
        || string.substring((dashIndexes[1])+1,dashIndexes[2])=="false")
    {
        data.task=null;
    }
    if(string.substring((dashIndexes[2])+1,dashIndexes[string.length])=="null"
        ||string.substring((dashIndexes[2])+1,dashIndexes[string.length])=="false")
    {
        data.subtask=null;
    }
    if(string.substring((dashIndexes[0])+1,dashIndexes[1])=="null"
        ||string.substring((dashIndexes[0])+1,dashIndexes[1])=="false")
    {
        data.day=null;
    }

    return data;
}

// function for pulling day (string), month(no.) and date(no.) from a date
function getDateDetails(dateObject)
{
    let data = {date: null,day: "",month: null, shortday: ""};

    data.date = dateObject.getDate();

    let days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    data.day = days[dateObject.getDay()];

    let shortdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    data.shortday = shortdays[dateObject.getDay()];


    let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    data.month = months[dateObject.getMonth()];

    return data;
}

// generates a displayable string of html for a given due date based on today's date
function generateDueDateString(dueDateString)
{
    // NOTE: just alter span using same thing
    let dueDateOut = {string:"",past:false};

    if(dueDateString!="")
    {
        // parse String to ms then use ms to create a new date
        let dueDate = new Date(Date.parse(dueDateString));
        let dueDateData = getDateDetails(dueDate);
        dueDateOut.string = `${dueDateData.shortday} ${dueDateData.date} ${dueDateData.month} - `

        let today = new Date();

        let diffInWeeks = Math.floor((dueDate - today)/(7 * 1000 * 60 * 60 * 24));

        let diffInDays = Math.floor((dueDate - today)/(1000 * 60 * 60 * 24))+1;

        if(Math.abs(diffInWeeks)>1) // if weeks are relevant (2 weeks or more)
        {
            if(diffInWeeks>0)
            {
                dueDateOut.string += `In ${diffInWeeks} Weeks`;
            }
            else if(diffInWeeks<0)
            {
                dueDateOut.string += `${Math.abs(diffInWeeks)} Weeks Ago`;
                dueDateOut.past = true;
            }
        }

        else // if only days are relevant (less than 2 weeks)
        {
            if(diffInDays>0)
            {
                dueDateOut.string += `In ${diffInDays} Days`;
            }
            else if(diffInDays<0)
            {
                dueDateOut.string += `${Math.abs(diffInDays)} Days Ago`;
                dueDateOut.past = true;
            }
            else if(diffInDays==0)
            {
                dueDateOut.string += `Due Today`;
            }
        }

    }

    return dueDateOut;
}

// PAGE DISPLAY FUNCTIONS ------------------------------------------------------------------------------------------------------------------------------------

// function for generating empty html of taskArray for each day
function updateTasks(lowerI,upperNI)
{
    // i cycles through days within given range
    for(let i=lowerI;i<upperNI;i++)
    {
        // variable to written into innerHTML of alltasks container
        let taskshtml="";

        // j cycles through tasks for day i
        for(let j=0;j<dayArray[i].taskArray.length;j++)
        {
            // is main task checked? (strikethrough only)
            let taskId = `id="task-desc-${i}-${j}-null"`;
            if(dayArray[i].taskArray[j].checked)
            {
                taskId += ` style="text-decoration: line-through"`;
            }

            // should this task be highlighted?
            let focusString="";
            if(i==indexFocus.day&&j==indexFocus.task&&null==indexFocus.subtask)
            {
                focusString=`focused-task`;
            }

            // adding button to collapse/expand if the task has subtasks
            let expandable = "";
            let subtaskOpenerString = "";
            let subtaskCloserString = "";
            let thisTaskClosed = false;

            if(dayArray[i].taskArray[j].subtaskArray.length>0)
            {

                // toggling button based on storage state
                let innerButtonString = "remove";
                let maxHeight = "500000px";
                if(dayArray[i].taskArray[j].closed!=undefined)
                {
                    if(dayArray[i].taskArray[j].closed)
                    {
                        innerButtonString = "add";
                        maxHeight = "0px";
                        thisTaskClosed = true;
                    }
                }

                subtaskOpenerString = `<div id="subtask-container-${i}-${j}-null" class="subtask-container" style="max-height: ${maxHeight}">`;
                subtaskCloserString = `</div>`;
                
                expandable = `<button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored expander">
                                  <i class="material-icons" id="expander-${i}-${j}-null">${innerButtonString}</i>
                              </button>`
            }
            
            // adding task
            taskshtml +=
            `<div class="task-container ${focusString}" id="task-container-${i}-${j}-null">
            <div class="task-slot" id="task-slot-${i}-${j}-null">
                <label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="list-checkbox-${i}-${j}-null">
                <input type="checkbox" id="list-checkbox-${i}-${j}-null" class="mdl-checkbox__input"/>
                </label>
                <div ${taskId} class="task-text">${dayArray[i].taskArray[j].description}</div>
                ${expandable}
            </div>`;

            // add bar if task has subtasks to show or if task has a due date or if task is in focus AND its drawer is open
            if(((dayArray[i].taskArray[j].subtaskArray.length>0
                ||(indexFocus.day==i&&indexFocus.task==j))
                &&(!thisTaskClosed))
                ||dayArray[i].taskArray[j].dueDate)
            {
                taskshtml+=`<hr>`;
            }

            // adding opener div for subtask expansion
            taskshtml += subtaskOpenerString;

            // k cycles through subtasks for task j on day i
            for(let k=0;k<dayArray[i].taskArray[j].subtaskArray.length;k++)
            {
                // is this subtask checked? (strikethrough only)
                let subtaskId = `id="task-desc-${i}-${j}-${k}"`;
                if(dayArray[i].taskArray[j].subtaskArray[k].checked)
                {
                    subtaskId += ` style="text-decoration: line-through"`;
                }

                // should this subtask be highlighted?
                let sFocusString="";
                if(i==indexFocus.day&&j==indexFocus.task&&k==indexFocus.subtask)
                {
                    sFocusString=`focused-subtask`;
                }
                // adding subtask
                taskshtml+= `<div class="subtask-slot ${sFocusString}" id="task-slot-${i}-${j}-${k}">
                                <label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="list-checkbox-${i}-${j}-${k}">
                                <input type="checkbox" id="list-checkbox-${i}-${j}-${k}" class="mdl-checkbox__input"/>
                                </label>
                                <div class="subtask-text" ${subtaskId}>${dayArray[i].taskArray[j].subtaskArray[k].description}</div>
                            </div>`;

                // only add bar if not last subtask or if task is focused (has create subtask box below it)
                if(k!=(dayArray[i].taskArray[j].subtaskArray.length-1)
                   ||((i==indexFocus.day)&&(j==indexFocus.task))
                   ||(k==(dayArray[i].taskArray[j].subtaskArray.length-1))&&dayArray[i].taskArray[j].dueDate!="")// if on last one and due date is around, add a line
                {
                    taskshtml+=`<hr class="short-bar">`;
                }

            }
            // adding div to add a subtask if in focus
            if((i==indexFocus.day)&&(j==indexFocus.task))
            {
                taskshtml+= `<div class="subtask-slot">
                                <textarea placeholder="Add a Subtask"
                                id="input-${i}-${j}-false"
                                style="z-index:100; margin-left:11.5%;
                                margin-top: 2px; margin-bottom:0px; font-size: 16px;"
                                rows = "1"
                                oninput = "textareaExpand(${i},${j},false)"
                                onkeyup = "if (event.keyCode == 13) addTask(${i},${j},false)"></textarea>
                            </div>`
            }

            // adding due date and repetition to one task j on a given day i
            if((i==indexFocus.day)&&(j==indexFocus.task)) // if in focus add date and repetition editor
            {
                taskshtml +=`<hr>
                            <div class="task-slot" style="font-size: 16px; color:rgb(114, 114, 114);">
                                Due Date:
                                <div style="flex-direction: row; display:flex;" name="dateInput" >

                                    <input class="mdl-textfield__input" type="number" id="date1" name="dateInput" 
                                           onkeyup="if (event.keyCode == 13) updateFocusedDueDate()"
                                           style="margin-left: 8px;">
                                    <label class="mdl-textfield__label" for="date1"></label>
                                    /
                                    <input class="mdl-textfield__input" type="number" id="date2" name="dateInput" 
                                           onkeyup="if (event.keyCode == 13) updateFocusedDueDate()">
                                    <label class="mdl-textfield__label" for="date2"></label>
                                    /
                                    <input class="mdl-textfield__input" type="number" id="date3" name="dateInput" 
                                           onkeyup="if (event.keyCode == 13) updateFocusedDueDate()">
                                    <label class="mdl-textfield__label" for="date3"></label>
                                </div>
                            </div>
                            <div class="task-slot" style="font-size: 16px; color:rgb(114, 114, 114);">
                                Repeat every
                                <div style="flex-direction: row; display:flex;" name="dateInput" >
                                    <input class="mdl-textfield__input" type="number" id="repeatFrequency" 
                                           name="dateInput" style="margin-left: 8px; margin-right: 6px;" 
                                           onkeyup="if (event.keyCode == 13) updateRepetition(0,false)">
                                    <label class="mdl-textfield__label" for="repeatFrequency"></label>
                                </div>
                                days
                            </div>`
                
                // closing subtask container if necessary
                taskshtml+=subtaskCloserString;

            }
            else // if not in focus // ADD a repeat every 3 days/months &/or duedate
            {
                // closing subtask container if necessary
                taskshtml+=subtaskCloserString;

                // adding duedate display
                let dueDate = generateDueDateString(dayArray[i].taskArray[j].dueDate);
                let color = `color: rgb(50,190,166);`;
                if(dueDate.past&&!(dayArray[i].taskArray[j].checked)) // if dueDate has gone by and it hasn't been ticked off
                {
                    color = `color: red;`;
                }
                if(dayArray[i].taskArray[j].checked)
                {
                    color = `text-decoration: line-through;`;
                }

                taskshtml+= `<span class="due-date" style="text-align: center;${color}" id=due-date-${i}-${j}-null>${dueDate.string}</span>`;

                // adding repetition display
                let repetitionString = ""
                if(dayArray[i].taskArray[j].repetition!=undefined&&dayArray[i].taskArray[j].repetition.id!=null&&dayArray[i].taskArray[j].repetition.frequency!="")
                {
                    // adding a break if a date was displayed as well
                    if(dueDate.string!="")
                    {
                        taskshtml+=`<br>`;
                    }
                    repetitionString = `Every ${dayArray[i].taskArray[j].repetition.frequency} Days`;
                }
                taskshtml+= `<span class="due-date" style="text-align: center;" id=due-date-${i}-${j}-null>${repetitionString}</span>`;
            }

            // closing container for task j
            taskshtml+=`</div>`;
        }

        // adding data to correct alltasks div
        let element = document.getElementById(`all-tasks-${i}-null-null`);
        element.innerHTML=taskshtml;

        // ticking required mdl checkboxes for that day (can only be done once checkbox has been inserted)
        for(let j=0;j<dayArray[i].taskArray.length;j++)
        {
            document.getElementById(`list-checkbox-${i}-${j}-null`).checked = false;
            if(dayArray[i].taskArray[j].checked)
            {
                document.getElementById(`list-checkbox-${i}-${j}-null`).checked = true;
            }

            for(let k=0;k<dayArray[i].taskArray[j].subtaskArray.length;k++)
            {
                // is this subtask checked? (checkbox only)
                document.getElementById(`list-checkbox-${i}-${j}-${k}`).checked = false;
                if(dayArray[i].taskArray[j].subtaskArray[k].checked)
                {
                    document.getElementById(`list-checkbox-${i}-${j}-${k}`).checked = true;
                }
            }
        }

        // if focus is on a task in that day, link and fill in date/repetition editor
        // NOTE: only i is defined at this scope, not j and k
        if((i==indexFocus.day)&&(indexFocus.task!=null))
        {
            // linking date inputs
            let date1 = document.getElementById("date1");
            let date2 = document.getElementById("date2");
            let date3 = document.getElementById("date3");

                // backward navigation

                date3.addEventListener("keydown",(event)=>{
                    if(`${event.code}`=="Backspace"&&date3.value.length==0)
                    {
                        date2.focus();
                        date2.select();
                    } return;
                })

                date2.addEventListener("keydown",(event)=>{
                    if(`${event.code}`=="Backspace"&&date2.value.length==0)
                    {
                        date1.focus();
                        date1.select();
                    } return;
                })        

            // filling in with stored inputs
                // date
                let relevantDueDate = new Date(Date.parse(dayArray[i].taskArray[indexFocus.task].dueDate));
                date1.value = `${relevantDueDate.getDate()}`;
                date2.value = `${relevantDueDate.getMonth()+1}`;
                date3.value = `${relevantDueDate.getFullYear()-2000}`; // all years are from 2000 - 2100;

                // repetition (may be undefined as storage was created well before this was implemented)
                let repetitionData = dayArray[i].taskArray[indexFocus.task].repetition;
                if(repetitionData==undefined)
                {
                    repetitionData =    {id: null,
                                            frequency: "",
                                        };
                }

                document.getElementById("repeatFrequency").value = repetitionData.frequency;
        }
    }
    return;
}

// function for displaying days from dayArray
function displayDays()
{
    let html = "";
    let element = document.getElementById("forAddingDays")

    for(let i=0;i<dayArray.length;i++)
    {
        let snapAdder = "";
        // if start of week adding class which will provide a snap to
        if(((i+5)%7)==0||((i+2)%7)==0||(i%7)==0||i==indexCurrentDay) // monday, thursday, saturday, current day (mandatory)
        //if(i==indexCurrentDay||dayArray[i].taskArray.length>0) // current day, days with tasks (proximity)
        {
            snapAdder = `snap`;
        }

        // adding gold border around current day
        let goldBorderString = "";
        if(i==indexCurrentDay)
        {
            goldBorderString = `current-day-header`;
        }

        // Getting date data
        let newDateObject = new Date(2021, 4, 1, 0, 0, 0);
        newDateObject.setDate(DAY_ZERO.getDate()+i);

        let data = getDateDetails(newDateObject);

        // adding indexed id to day container for auto-scroll reasons
        html += `<div class="day-container ${snapAdder}" id="day-container-${i}-null-null">
                    <div class="day-header ${goldBorderString}" id="defocus-${i}-null-null">${data.day}</div>
                    <div class="bottom-detail">
                        <textarea
                        class = "textarea-date"
                        placeholder="Add a Task"
                        id="input-${i}-false-false"
                        style="width: 70%; z-index:100;"
                        rows = "1"
                        oninput = "textareaExpand(${i},false,false)"
                        onkeyup = "if (event.keyCode == 13) addTask(${i},false,false)"></textarea>
                        <div class="date-holder unselectable" id="defocus-${i}-null-null">${data.date} ${data.month}</div>
                    </div>
                    <div class="all-tasks" id="all-tasks-${i}-null-null"></div>
                 </div>`;
    }

    // adding empty days to the page
    element.innerHTML = html;
    return;
}

// handles text area expansions
function textareaExpand(day,task,subtask)
{
    // resizing text area with that id
    let textarea = document.getElementById(`input-${day}-${task}-${subtask}`);
    textarea.style.height = "";
    textarea.style.height = textarea.scrollHeight + "px";
    if(textarea.style.height == "26px"||textarea.style.height == "25px")
    {
        textarea.style.height="";
    }
}

// grabs local storage and displays page from it (triggered on pageload and on display visible)
function displayPage() {
    // update with local storage
    if(checkIfDataExistsLocalStorage())
    {
        allData = getDataLocalStorage();
        indexFirstEmptyDay = allData.arrayStorage.length;
        repetitionCount = allData.countStorage;

        for(let i=0;i<allData.arrayStorage.length;i++)
        {
            let newDay = new Day();
            newDay.fromData(allData.arrayStorage[i]);
            dayArray.push(newDay);
        }
    }

    // generating new days if necessary
    let today = new Date();
    indexCurrentDay = Math.floor(((today.getTime())-(DAY_ZERO.getTime()))/(1000 * 3600 * 24));
    updateBuffer();
    updateLocalStorage(dayArray);

    // displaying days
    displayDays();
    updateTasks(0,dayArray.length);
        // remove defer in mdl src on html for this to work
        componentHandler.upgradeDom();

    let elmnt = document.getElementById(`day-container-${indexCurrentDay+4}-null-null`);
    elmnt.scrollIntoView(true);

    return;
}

// INPUT DETECTION FUNCTIONS ---------------------------------------------------------------------------------------------------------------------------------

// handles clicks/double clicks on page for focusing, box checking, editing of tasks/subtasks (NOTE: click doesn't detect margins)
function pageClick(event)
{
    let clickedId = event.target.id;
    let clickedTime = new Date();

    // edit on double click
    if(clickedId==lastClick.id
        && (clickedTime-lastClick.time)<500
        && ((clickedId.substring(0,9)=="task-desc")||(clickedId.substring(0,9)=="task-slot"))) // if same element clicked, within the last 500 ms and the element is a task text element
    {
        // recovering pre-edited text
        let taskDescDiv = document.getElementById(`task-desc${clickedId.substring(9,clickedId.length)}`);
        let oldText = taskDescDiv.innerText;

        // getting day, task and subtask for addtask() in text area html
        let data = idStripper(clickedId.substring(9,clickedId.length));

        // if its a subtask, need smaller text in entry
        let styleAdditions = "width: 100%;";
        if(data.subtask!=null)
        {
            styleAdditions = "width: 97%; font-size: 16px;";
        }

        // generating textarea html
        let textareaHtml = `<textarea
                            id="input-${data.day}-${data.task}-${data.subtask}"
                            style=" z-index:100;
                            ${styleAdditions}"
                            rows = "1"
                            oninput = "textareaExpand(${data.day},${data.task},${data.subtask})"
                            onkeyup = "if (event.keyCode == 13) addTask(${data.day},${data.task},${data.subtask})">${oldText}</textarea>`;

        // adding textarea into id
        taskDescDiv.innerHTML = textareaHtml;

        // resize
        textareaExpand(data.day,data.task,data.subtask);

        // focusing on end of textarea
        let newTextarea = document.getElementById(`input-${data.day}-${data.task}-${data.subtask}`);
        newTextarea.focus();
        newTextarea.select();
        newTextarea.selectionStart = newTextarea.selectionEnd;
    }

    // checkbox clicked
    else if(clickedId.substring(0,13)=="list-checkbox")
    {
        // checkbox tick/untick function
        let data = idStripper(clickedId.substring(13,clickedId.length));
        boxChecked(data.day,data.task,data.subtask);
    }

    // expansion button clicked
    else if(clickedId.substring(0,8)=="expander")
    {
        let data = idStripper(clickedId.substring(8,clickedId.length));

        // animate toggling drawer
        toggleDrawer(data.day,data.task);

        // focus on it only if its open
        if(!dayArray[data.day].taskArray[data.task].closed)
        {
            focusOn(data.day,data.task,null);
        }
        else // otherwise defocus
        {
            focusOn(data.day,null,null);
        } 
    }

    // task to bring into focus
    else if(clickedId.substring(0,4)=="task")
    {
        let data={};
        if(clickedId.substring(0,9)=="task-desc") // task words clicked
        {
            data = idStripper(clickedId.substring(9,clickedId.length));
        }
        else if(clickedId.substring(0,14)=="task-container")
        {
            data = idStripper(clickedId.substring(14,clickedId.length));
        }
        else if(clickedId.substring(0,9)=="task-slot")// task or subtask slot clicked
        {
            data = idStripper(clickedId.substring(9,clickedId.length));
        }

        // if drawer exists and was closed, open it
        if(dayArray[data.day].taskArray[data.task].closed
           &&dayArray[data.day].taskArray[data.task].subtaskArray.length>0) 
        {
            toggleDrawer(data.day,data.task);   
        }

        focusOn(data.day,data.task,data.subtask);

    }

    // defocus tasks (defocus, alltasks, day-container)
    else if(clickedId.substring(0,7)=="defocus")
    {
        let data = idStripper(clickedId.substring(7,clickedId.length));
        focusOn(data.day,data.task,data.subtask);
    }
    else if(clickedId.substring(0,13)=="day-container")
    {
        let data = idStripper(clickedId.substring(13,clickedId.length));
        focusOn(data.day,data.task,data.subtask);
    }
    else if(clickedId.substring(0,9)=="all-tasks")
    {
        let data = idStripper(clickedId.substring(9,clickedId.length));
        focusOn(data.day,data.task,data.subtask);
    }
    else if(clickedId.substring(0,5)=="input")
    {
        let data = idStripper(clickedId.substring(5,clickedId.length));
        // ensuring defocus only if bottom entry is clicked
        if(data.task==null)
        {
            focusOn(data.day,data.task,data.subtask);
        }
    }
    else if(clickedId.substring(0,8)=="due-date")
    {
        let data = idStripper(clickedId.substring(8,clickedId.length));
        focusOn(data.day,data.task,data.subtask);
    }

    // storing click id and time of click
    lastClick.time = clickedTime;
    lastClick.id = clickedId;

    return;
}

// handles keyups on wasd and delete and e (set duedate) keys
function pageKeyPress(event)
{
    if(event.keyCode == 46
       && document.activeElement.id.substring(0,5)!="input") // delete pressed outside of input
    {
        removeFocused();
    }

    else if (document.activeElement.id.substring(0,5)!="input"
             && document.activeElement.id.substring(0,15)!="repeatFrequency"
             && document.activeElement.id.substring(0,4)!="date"
             && indexFocus.task!==null) // wasd only triggers outside of inputs and when task is not null
    {
        if(event.keyCode == 65) // a (left) pressed
        {
            event.preventDefault();
            move("left");
        }
        else if(event.keyCode == 87) // w (up) pressed
        {
            event.preventDefault();
            move("up");
        }
        else if(event.keyCode == 68) // d (right) pressed
        {
            event.preventDefault();
            move("right");
        }
        else if(event.keyCode == 83) // s (down) pressed
        {
            event.preventDefault();
            move("down");
        }
    }

    return;
}

// Global Constants
const DAY_ZERO = new Date(2021, 4, 1, 0, 0, 0); // DAY ZERO is 1 May 2021 12:00 AM
const DATA_KEY = "TaskData";

// ON PAGELOAD

    // Global Variables
    let allData;
    let indexFirstEmptyDay = 0;
    let repetitionCount = 0;
    let dayArray = [];
    let indexFocus = {day: null,task: null, subtask: null};
    let indexCurrentDay = null;
    let lastClick = {time: new Date(0), id: ""};

    // display page
    displayPage();

    // will run on first launch on that device
    if(repetitionCount == 0)
    {
        // add one to repetition count


        // gives first time instructions
        let instruction = new Task("Welcome to To Do, I only work with a physical keyboard and in fullscreen, try ticking me off");
        dayArray[indexCurrentDay].taskArray.push(instruction);

        instruction = new Task("Double click on this text to edit the task, then press enter to confirm changes");
        dayArray[indexCurrentDay+1].taskArray.push(instruction);

        instruction = new Task("Click on me, then press wasd to move me around");
        dayArray[indexCurrentDay+2].taskArray.push(instruction);
        let minorInstruction1 = new Subtask("I'm a subtask, pressing the - button will hide me");
        dayArray[indexCurrentDay+2].taskArray[0].subtaskArray.push(minorInstruction1);
        let minorInstruction2 = new Subtask("Repetitions (Every __ Days) only create in the future, after clicking on a task, entering a number and hitting enter");
        dayArray[indexCurrentDay+2].taskArray[0].subtaskArray.push(minorInstruction2);
        let minorInstruction3 = new Subtask("To remove a repetition, remove the frequency and hit enter");
        dayArray[indexCurrentDay+2].taskArray[0].subtaskArray.push(minorInstruction3);

        instruction = new Task("Click on me to focus me, then press delete to remove me");
        dayArray[indexCurrentDay+3].taskArray.push(instruction);

        instruction = new Task("Scroll horizontally to see more days, delete us all when you're done so we won't show up next time");
        dayArray[indexCurrentDay+4].taskArray.push(instruction);

        // updating tasks on those days
        updateTasks(indexCurrentDay,indexCurrentDay+5);
        
        // update local storage too
    }

