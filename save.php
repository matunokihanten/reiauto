<?php
$data = file_get_contents('php://input');
if ($data) {
    // layout.json を書き込みモードで開く
    $fp = fopen('layout.json', 'w');
    if ($fp) {
        // 排他ロックをかける（他の書き込みが終わるまで待つ）
        if (flock($fp, LOCK_EX)) {
            fwrite($fp, $data);
            fflush($fp);            // 確実にディスクに書き込む
            flock($fp, LOCK_UN);    // ロック解除
            echo "success";
        } else {
            http_response_code(500);
            echo "error: Could not lock file";
        }
        fclose($fp);
    }
}
?>