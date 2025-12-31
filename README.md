Servo types and configuration
AX/MX servos (Dynamixel)
16 servos (IDs 0-15)
Position range: 0-4095
Baud rate: 230400
Used for main body/leg joints
XL320 servos
2 servos (IDs 19-20)
Position range: 0-1023
Baud rate: 57600
Used for hand/arm joints
Servo control commands
1. SetServo command (Lines 5560-5691)
Format: SetServo:pos0:pos1:...:pos15:xl320_0:xl320_1:velocity
Sets all 18 servos (16 AX/MX + 2 XL320)
Validates position ranges
Applies motor offsets automatically
Uses sync_write for servos 0-11
2. SetServoPartial command (Lines 5330-5558)
Format: SetServoPartial:id0,id1,id2:pos0:pos1:pos2:vel
Example: SetServoPartial:0,1,19:2300:2048:700:256
Controls only specified servos
Supports any combination of valid IDs (0-15, 19-20)
Core servo functions
1. sw() - Sync Write (Lines 504-543)
Synchronous write for 12 servos (0-11)
Applies motor offsets: final_pos = pos + a.motor[i]
Uses Dynamixel sync_write instruction
Address 30 (position), address 32 (velocity)
2. sw1() - Extended Sync Write (Lines 706-728)
Synchronous write for all 16 AX/MX servos
Similar to sw() but handles 16 servos
3. motor() - Motor Control (Lines 626-704)
Converts joint angles to servo positions
Handles left/right leg kinematics
Applies direction multipliers
Converts radians to position values using converttopos (652.229)
4. xl320_write() / xl320_torque_control() (Lines 7110-7115)
Controls XL320 servos (IDs 19-20)
Torque control via address 24
Converts velocity to RPM: rpm = (velocity * 300) / 1024
Compliance settings
1. set_compliance_hand() (Line 93, used throughout)
Sets compliance for hand servos
Common values: 32 (normal), 128 (loose)
2. set_compliance_hmotor_CW() (Lines 7523-7550)
Sets clockwise compliance for hand motors (servos 11-16)
Address 28
3. set_compliance_hmotor_ACW() (Lines 7552-7588)
Sets anti-clockwise compliance for hand motors
Address 29
Motor offset management
a.getoffset() - Loads motor calibration offsets
a.motor[i] - Array storing offsets for each servo
Offsets are automatically added to positions before sending
Servo communication
1. readparam() (Lines 3427-3576)
Reads data from servos
Supports multiple baud rates (230400, 57600, 9600)
Handles packet parsing and error detection
2. Dynamixel initialization
dxl_initialize() - Opens USB2Dynamixel connection
dx_set_baud_230400() / dx_set_baud_57600() - Sets baud rates
dxl_write_word(id, address, value) - Writes to servo registers
dxl_read_byte(id, address) - Reads from servo registers
Servo status and monitoring
1. Motor voltage reading (Lines 6771-6789)
read_motor_voltage1() - Reads voltage from servos
Used for battery monitoring and error detection
2. Status return level (Lines 7592-7618)
set_status_return_level() - Configures servo response level
xl320_set_status_level() - Sets status level for XL320 servos
Torque control
torquecontrol() (Lines 7118-7142)
Broadcasts torque enable/disable to all 16 servos
Uses sync_write to address 24
Servos 0-9: always enabled (value 1)
Servos 10-15: configurable (parameter value)
Position and velocity arrays
pos[12], vel[12] - Arrays for 12 main servos
offmotor[12] - Offset array
Position values: 0-4095 (AX/MX) or 0-1023 (XL320)
Velocity values: typically 150-1024
Key constants
TOTAL_MOTOR = 16 - Total number of main servos
converttopos = 652.229 - Conversion factor (radians to position units)
NUM_ACTUATOR = 12 - Number of servos in sync_write group
Servo addressing
Code ID to Dynamixel ID mapping: Code ID i maps to Dynamixel ID i+1
Code ID 0 → Dynamixel ID 1
Code ID 15 → Dynamixel ID 16
XL320: Code IDs 19-20 map directly
Error handling
Position validation (clamping to max values)
Baud rate switching with error checking
Motion lock (motion flag) to prevent conflicts
Motor error detection and reporting
This covers the servo-related functionality in the codebase.