<?php



require "Authenticator.php";

$Authenticator = new Authenticator();
$checkResult = $Authenticator->verifyCode($_SESSION['auth_secret'], $_POST['code'], 2);    // 2 = 2*30sec clock tolerance

if (!$checkResult) {
    $_SESSION['failed'] = true;
    header("location: index.php");
    die();
} 


?>