import React, { useEffect, useState } from 'react';
import { Form, Input, Button, DatePicker, Select, TimePicker } from 'antd';
import { Row, Col } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

function TTSForm() {
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const handleVoicesChanged = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    // Trigger voiceschanged event in case it's already been fired
    window.speechSynthesis.getVoices();

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, []);

  const calculateDelay = (date, time) => {
    if (!date || !time) {
      return null;
    }
  
    // Combine date and time into a single moment object
    const dateTime = date.clone().hour(time.hour()).minute(time.minute());
  
    // Calculate the difference in milliseconds
    const now = dayjs();
    const delay = dateTime.diff(now);
  
    return delay > 0 ? delay : null; // Ensure delay is in the future
  };

  const cancelAlarm = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
      console.log('Alarm canceled');
    }
  };

  const disabledDate = (current) => {
    // Can not select days before today
    return current && current < dayjs().startOf('day');
  };

  const disabledTime = () => {
    const now = dayjs();
    const selectedDayIsToday = selectedDate && selectedDate.isSame(now, 'day');
  
    if (!selectedDayIsToday) {
      return {};
    }
  
    let hours = [];
    for (let i = 0; i < now.hour(); i++) {
      hours.push(i);
    }
  
    let minutes = [];
    if (selectedDate && selectedDate.hour() === now.hour()) {
      for (let i = 0; i < now.minute(); i++) {
        minutes.push(i);
      }
    }
  
    return {
      disabledHours: () => hours,
      disabledMinutes: () => minutes
    };
  };

  const handleSubmit = () => {
    console.log('Message:', message);

    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      window.alert('Your browser does not support speech synthesis.');
      return; // Exit if speech synthesis is not supported
    }

    const delay = calculateDelay(selectedDate, selectedTime);

    if (delay === null) {
      window.alert('Please select a future date and time.');
      return;
    }

    // Set a timeout to trigger the speech synthesis
    const timeoutId = setTimeout(() => {
      var msg = new SpeechSynthesisUtterance(message);
      const selectedVoiceObject = voices.find(voice => voice.name === selectedVoice);
      if (selectedVoiceObject) {
        msg.voice = selectedVoiceObject;
      }
      window.speechSynthesis.speak(msg);
    }, delay);
    setTimeoutId(timeoutId);
  };

  return (
    <Form
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Form.Item
        label="Your Message"
        required
      >
        <TextArea 
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Form.Item>
      <Form.Item>
        <Select
          style={{ width: '100%' }}
          onChange={(value) => setSelectedVoice(value)}
          placeholder="Select a voice"
        >
          {voices.map((voice) => (
            <Option key={voice.name} value={voice.name}>
              {voice.name} ({voice.lang})
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item>
        <Row gutter={16}> 
          <Col span={12}> 
            <DatePicker 
              disabledDate={disabledDate}
              style={{ width: '100%' }}
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Select Date"
              disabled={timeoutId !== null}
            />
          </Col>
          <Col span={12}>
            <TimePicker 
              style={{ width: '100%' }}
              format="HH:mm"
              disabledTime={disabledTime}
              value={selectedTime}
              onChange={setSelectedTime}
              placeholder="Select Time"
              disabled={timeoutId !== null}
            />
          </Col>
        </Row>
      </Form.Item>        
      <Form.Item>
        {timeoutId === null ? (
          <Button type="primary" htmlType="submit">
            Set Alarm
          </Button>
        ) : (
          <Button onClick={cancelAlarm}>
            Cancel Alarm
          </Button>
        )}
      </Form.Item>
    </Form>
  );
}

export default TTSForm;