<?
if (isset($_POST['code'])) {
    // зашлушка для формы отправки кода sms
    if ($_POST['code'] == 'qwe') {
        $data['errors'] = array(
            0 => array('code' => 'Неверный код подтверждения. Попробуйте снова.')
        );
    } else {
        $data = array(
            'success' => true
        );
    }
} else {
    // зашлушка для формы отправки телефона
    $data = array(
        'success' => true
    );
}

#sleep(1);

header('Content-Type: application/json');
echo json_encode($data);

?>