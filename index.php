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
            <p> In this game, you play Hockey. The hockey start at the center of the map, and you build 
                walls to bounce the hockey around. Whenever the hockey the hockey bounced at the left/right 
                border of the map, the right/left player gets one point.
                You only have a limited materials to build walls. You may salvage materials by destroying the 
                opponent's walls. You may build a wall every t1 time. and destroy the opponent's wall every 
                t2 time.
                The walls you build should have length between lmin < l < lmax. 
                Every second the hockey's on your side of map, your opponent gets sDecay points.
                After Tmax seconds, the game stops.
            </p>
            <p>
                Press <Strong>Z</strong> to change wall directions and <strong>D</strong>
            </p>
        </div>

        <h3>Leaderboard:</h3>
        <div id="scoreArea", class="jumbotron">
            <?php
            include $base."getScore.php";
            /*
            * arg1: gameName, should be the same as the dir name
            * arg2: if your score is sortable, pass 1 if higher score is better, 0
            *       if smaller score is better. Otherwise no need to pass variable
            */
            getScore("Hockey Game");
            ?>
        </div>
        <h3>Play game in pop up window:<h3>
        <form id="gameSettings" class="well"></form>
        <h4>Screenshot:</h4>
        <img src="./games/Hockey/Hockey.png" width="100%" heigth="100%"></img>
    </article>
    <?php include $base."footer.php"; ?>
</div>
<script type="text/javascript">
    newWindowBtn(1000,1000,"./games/Hockey/game.html",[]);
</script>
</body>
</html>
