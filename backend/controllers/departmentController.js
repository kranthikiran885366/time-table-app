const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const { logActivity } = require('../middleware/activityLogger');

// Get all departments
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('hodId', 'name email')
      .sort({ name: 1 });
    
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get department by ID
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('hodId', 'name email department');
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Get department statistics
    const facultyCount = await Faculty.countDocuments({ department: department.name });
    const Section = require('../models/Section');
    const sections = await Section.find({ department: department.name });
    const studentCount = sections.reduce((sum, s) => sum + (s.strength || 0), 0);
    
    res.json({
      ...department.toObject(),
      statistics: {
        facultyCount,
        sectionCount: sections.length,
        studentCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create department
const createDepartment = async (req, res) => {
  try {
    const department = new Department(req.body);
    await department.save();
    
    // Log activity
    await logActivity(req, {
      action: 'CREATE',
      entity: 'Department',
      entityId: department._id,
      description: `Created department: ${department.name} (${department.code})`
    });
    
    res.status(201).json(department);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Department name or code already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Update department
const updateDepartment = async (req, res) => {
  try {
    const oldDepartment = await Department.findById(req.params.id);
    if (!oldDepartment) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('hodId', 'name email');
    
    // Log activity
    await logActivity(req, {
      action: 'UPDATE',
      entity: 'Department',
      entityId: department._id,
      description: `Updated department: ${department.name}`,
      changes: { old: oldDepartment, new: department }
    });
    
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete department
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Check if department has faculty or sections
    const facultyCount = await Faculty.countDocuments({ department: department.name });
    const Section = require('../models/Section');
    const sectionCount = await Section.countDocuments({ department: department.name });
    
    if (facultyCount > 0 || sectionCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete department with existing faculty or sections',
        facultyCount,
        sectionCount
      });
    }
    
    await Department.findByIdAndDelete(req.params.id);
    
    // Log activity
    await logActivity(req, {
      action: 'DELETE',
      entity: 'Department',
      entityId: req.params.id,
      description: `Deleted department: ${department.name}`
    });
    
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign HOD
const assignHOD = async (req, res) => {
  try {
    const { departmentId, facultyId } = req.body;
    
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    // Update department
    department.hodId = facultyId;
    await department.save();
    
    // Update faculty role
    faculty.role = 'hod';
    await faculty.save();
    
    // Log activity
    await logActivity(req, {
      action: 'UPDATE',
      entity: 'Department',
      entityId: departmentId,
      description: `Assigned ${faculty.name} as HOD of ${department.name}`
    });
    
    res.json({ message: 'HOD assigned successfully', department });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get department analytics
const getDepartmentAnalytics = async (req, res) => {
  try {
    const departments = await Department.find();
    const Section = require('../models/Section');
    const Subject = require('../models/Subject');
    
    const analytics = await Promise.all(departments.map(async (dept) => {
      const facultyCount = await Faculty.countDocuments({ department: dept.name });
      const sections = await Section.find({ department: dept.name });
      const subjects = await Subject.countDocuments({ department: dept.name });
      const studentCount = sections.reduce((sum, s) => sum + (s.strength || 0), 0);
      
      return {
        id: dept._id,
        name: dept.name,
        code: dept.code,
        facultyCount,
        sectionCount: sections.length,
        subjectCount: subjects,
        studentCount,
        hod: dept.hodId
      };
    }));
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignHOD,
  getDepartmentAnalytics
};
