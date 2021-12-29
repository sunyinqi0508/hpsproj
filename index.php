<!DOCTYPE html>
<html>
<head>
    <?php $base = "../../" ?>
    <base href="../../">
    <script src="js/jquery-2.2.4.min.js"></script>
    <script src="js/facebox.js"></script>
    <script src="js/gameSettings.js"></script>
    <link rel="stylesheet" type="text/css" href="css/facebox.css"/>
    <link rel="stylesheet" type="text/css" href="css/main.css"/>
    <link rel="stylesheet" type="text/css" href="css/bootstrap.css"/>
    <script type="text/javascript">
        jQuery(document).ready(function($) {
            $('a[rel*=facebox]').facebox()
        })
    </script>
</head>
<body>
<div class="container">
    <?php include $base."header.php"; ?>
    <nav>
        <ul>
        <li><a href="">Home</a></li>
<!--            <li><a href="games/empty">Empty Template</a></li>-->
        </ul>
        <?php include $base."leftMenuGame.php"; ?>

    </nav>
    <article>
        <h1 id="gameName">Hockey Game</h1>
        <h3 id="groupName">Bill Sun (ys3540)</h3>
        <h3>Instruction:</h3>
        <div class="jumbotron">
            <p> In this game, you play Hockey. The hockey puck start at the center of the map, and you build 
                walls to bounce the puck around. Whenever the hockey puck bounced at the left/right 
                border of the map, the right/left player gets one point.<br>
                You only have limited materials to build walls. You may salvage materials by destroying your 
                opponent's walls. You may build a wall every t1 time and destroy your opponent's wall every 
                t2 time.<br>
                The walls you build should have length between lmin < l < lmax. Use the scroll wheel or pinch 
                on the game board to change the length of the wall. (You may need to press 'O' or click on the 
                Scroll button to disable scrolling before you do that. Press/click again to re-enable scrolling.). 
                Or you can use +(=)/- keys to zoom in and out.<br>.
            </p>
            <p>
                Press <strong>T</strong> to pause the game for 3 seconds. Whenever player A takes control over opponent B. 
                B get one chance of pausing the game to move the cursor back and retake control. During the pause, the game 
                will freeze. <br>
                Press <strong>Z</strong> to change wall directions. You can only delete your opponents' wall. 
                To delete a wall, press 
                <strong>D</strong> or <strong>X</strong> on <strong>your side</strong> of the map and when the 
                cursor becomes a cross, move the cursor to <strong>your opponent's side</strong> 
                and click a wall highlighted in yellow to delete it. You can't delete a wall when your delete 
                action is on cool down (The time left in cool down shows in the status panel). Press D or X again 
                to exit delete mode without deleting a wall.<br>
             </p>
             <p><strong>Game Play:</strong></p> <br>
            <p><strong>Single Player:</strong>
                In single-player mode, whenever the puck hits the vertical boundary, you lose a point. 
                The objective is to minimize the times that the puck hits the vertical boundaries. 
            <br></p>
            <p><strong>VS AI:</strong> This is a demonstration of the multiplayer game, in this case you will be the left player, 
            the bot will play on the right. <br></p>
            <p><strong>Multiplayer:</strong> In order to make it more comfortable for two players to share a single keyboard, 
                You can select `Separate Control' option. The key binding for Separate Control mode is: <br>
                    Player 1: Toggle Delete: D/X; Change Wall Type (Horizontal/Vertical): Z; Zoom In: 2; Zoom Out: 1<br>
                    Player 2: Toggle Delete: K/,(Comma); Change Wall Type (Horizontal/Vertical): .(Dot/Period); Zoom In: -(_); Zoom Out: +(=)<br></p>
             <p>The game will stop after Tmax seconds.<br></p>
             <img src="./games/Hockey/kb_sep.png" width="100%" height="100%"/>
        </div>

        <h3>Play game in pop up window:<h3>
        <form id="gameSettings" class="well"></form>
        <h4>Screenshot:</h4>
        <img src="./games/Hockey/Hockey.png" width="100%" height="100%"></img>
    </article>
    <?php include $base."footer.php"; ?>
</div>
<script type="text/javascript">
    newWindowBtn(1000,1000,"./games/Hockey/game.html",[]);
</script>
</body>
</html>
