## TODO

### Sigur
- user create method
- user disable method

### Moodle
0. [WIP] Prepare for uploading all users to moodle, rewrite sync logic to match umed
1. Get active courses with idnumber filled
2. Get users of these courses
3. Group users by group name
4. For each user get his role: student
5. For each user get his final grade for this course
6. Using startdate get start date of this discipline
7. Create request to upload grades to 1C: Course idnumber, StartDate, Teacher Name, Group name, Student name, Final grade
8. 1C should create grade report by group using this data, where discipline = find discipline by course idnumber, startdate = startdate, teacher name = teacher, group name = group, student name = table - studentname, final grade = table - grade