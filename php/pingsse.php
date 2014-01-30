<?php

header("Content-Type: text/event-stream\n\n");

$ip = $_GET['ip'];

$exe_command = 'C:\\Windows\\System32\\ping.exe -n 5 '.$ip;
$descriptorspec = array(
    0 => array("pipe", "r"),  // stdin
    1 => array("pipe", "w"),  // stdout -> we use this
    2 => array("pipe", "w")   // stderr 
);

$process = proc_open($exe_command, $descriptorspec, $pipes);

if (is_resource($process)) {
    while ($s = fgets($pipes[1])) {  
        echo "data: " . json_encode($s) . PHP_EOL;
        echo PHP_EOL;
        ob_flush(); 
        flush();  
    } 
}
  
?>