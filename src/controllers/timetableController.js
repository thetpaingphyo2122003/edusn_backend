// src/controllers/timetableController.js
const timetableRepository = require('../repositories/timetableRepository');
const TimetableSettings = require('../models/TimetableSettings');
const NotificationService = require('../services/notificationService');

const CLASS_COLOR_MAP = {
    Indigo: 'bg-sky',
    Sangria: 'bg-yellow',
    Fuchsia: 'bg-lightred',
    Morado: 'bg-purple',
    Azura: 'bg-green',
    Crimson: 'bg-cri',
    Helio: 'bg-hel',
    Mocha: 'bg-lightred',
};

const ROW_HIGHLIGHT_MAP = {
    Morado: true,
};

const applyClassDefaults = (body) => {
    const payload = { ...body };
    if (payload.class_name) {
        if (!payload.color_class) {
            payload.color_class = CLASS_COLOR_MAP[payload.class_name] || 'bg-sky';
        }
        if (payload.row_highlight === undefined) {
            payload.row_highlight = ROW_HIGHLIGHT_MAP[payload.class_name] || false;
        }
    }
    return payload;
};

const getAllTimetables = async (req, res, next) => {
    try {
        const { status } = req.query;
        const query = { status: status || 'active' };

        const timetables = await timetableRepository.findAll(query, {
            sort: { academic_year: 1, display_order: 1, start_time: 1 },
        });

        res.json({
            success: true,
            count: timetables.length,
            data: timetables,
        });
    } catch (error) {
        next(error);
    }
};

const getAllTimetablesAdmin = async (req, res, next) => {
    try {
        const { status, academic_year } = req.query;
        const query = {};
        if (status && status !== 'all') query.status = status;
        if (academic_year && academic_year !== 'all') query.academic_year = academic_year;

        const timetables = await timetableRepository.findAll(query, {
            sort: { academic_year: 1, display_order: 1, start_time: 1 },
        });

        res.json({
            success: true,
            count: timetables.length,
            data: timetables,
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
    } catch (error) {
        next(error);
    }
};

const createTimetable = async (req, res, next) => {
    try {
        const timetable = await timetableRepository.create(applyClassDefaults(req.body));
        NotificationService.timetableCreated(timetable, req.user._id).catch((err) =>
            console.error('Timetable notification error:', err)
        );
        res.status(201).json({ success: true, data: timetable });
    } catch (error) {
        next(error);
    }
};

const updateTimetable = async (req, res, next) => {
    try {
        const { id } = req.params;
        const timetable = await timetableRepository.updateById(id, applyClassDefaults(req.body));
        res.json({ success: true, data: timetable });
    } catch (error) {
        next(error);
    }
};

const deleteTimetable = async (req, res, next) => {
    try {
        const { id } = req.params;
        await timetableRepository.deleteById(id);
        res.json({ success: true, message: 'Timetable deleted' });
    } catch (error) {
        next(error);
    }
};

const getTimetablePageSettings = async (req, res, next) => {
    try {
        let settings = await TimetableSettings.findOne();
        if (!settings) {
            settings = await TimetableSettings.create({});
        }
        res.json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

const updateTimetablePageSettings = async (req, res, next) => {
    try {
        let settings = await TimetableSettings.findOne();
        const payload = {
            default_description: req.body.default_description,
            default_image: req.body.default_image,
            year_sections: req.body.year_sections,
        };

        if (settings) {
            settings = await TimetableSettings.findByIdAndUpdate(settings._id, payload, { new: true });
        } else {
            settings = await TimetableSettings.create(payload);
        }

        res.json({
            success: true,
            message: 'Timetable page settings updated',
            data: settings,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllTimetables,
    getAllTimetablesAdmin,
    getTimetablesByYear,
    createTimetable,
    updateTimetable,
    deleteTimetable,
    getTimetablePageSettings,
    updateTimetablePageSettings,
};
