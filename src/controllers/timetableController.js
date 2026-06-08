// src/controllers/timetableController.js
const timetableRepository = require('../repositories/timetableRepository');

const getAllTimetables = async (req, res, next) => {
    try {
        const { status } = req.query;
        let query = {};
        
        // If status filter is provided
        if (status) {
            query.status = status;
        }
        
        const timetables = await timetableRepository.findAll(query);
        
        res.json({
            success: true,
            count: timetables.length,
            data: timetables
        });
    } catch (error) {
        next(error);
    }
};


const getTimetablesByYear = async (req, res, next) => {
    try {
        const { year } = req.params;
        const timetables = await timetableRepository.findByAcademicYear(year);
        res.json({ success: true, data: timetables });
    } catch (error) { next(error); }
};

const createTimetable = async (req, res, next) => {
    try {
        const timetable = await timetableRepository.create(req.body);
        res.status(201).json({ success: true, data: timetable });
    } catch (error) { next(error); }
};

const updateTimetable = async (req, res, next) => {
    try {
        const { id } = req.params;
        const timetable = await timetableRepository.updateById(id, req.body);
        res.json({ success: true, data: timetable });
    } catch (error) { next(error); }
};

const deleteTimetable = async (req, res, next) => {
    try {
        const { id } = req.params;
        await timetableRepository.deleteById(id);
        res.json({ success: true, message: 'Timetable deleted' });
    } catch (error) { next(error); }
};

module.exports = { getAllTimetables, getTimetablesByYear, createTimetable, updateTimetable, deleteTimetable };