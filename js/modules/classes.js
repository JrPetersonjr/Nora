/**
 * Classes Module
 * Manages classes and their assignments
 */
class ClassesModule {
  constructor() {
    this.STORAGE_KEY = 'student-helper-classes';
    this.statsKey = 'student-helper-stats';
    this.classes = this.loadClasses();
  }

  loadClasses() {
    const saved = storage.get(this.STORAGE_KEY);
    return saved || [];
  }

  saveClasses() {
    storage.set(this.STORAGE_KEY, this.classes);
    this.updateStats();
  }

  addClass(name, instructor = '') {
    try {
      Validators.validateClassname(name);

      const newClass = {
        id: Date.now(),
        name: Validators.sanitizeInput(name),
        instructor: Validators.sanitizeInput(instructor),
        assignments: [],
        createdAt: new Date().toISOString()
      };

      this.classes.push(newClass);
      this.saveClasses();

      return newClass;
    } catch (error) {
      throw error;
    }
  }

  getClass(id) {
    return this.classes.find(cls => cls.id === id);
  }

  deleteClass(id) {
    this.classes = this.classes.filter(cls => cls.id !== id);
    this.saveClasses();
  }

  addAssignment(classId, name, dueDate = null) {
    const cls = this.getClass(classId);
    if (!cls) throw new Error('Class not found');

    const assignment = {
      id: Date.now(),
      name: Validators.sanitizeInput(name),
      dueDate: dueDate || null,
      completed: false,
      createdAt: new Date().toISOString()
    };

    cls.assignments.push(assignment);
    this.saveClasses();

    return assignment;
  }

  updateAssignment(classId, assignmentId, updates) {
    const cls = this.getClass(classId);
    if (!cls) throw new Error('Class not found');

    const assignment = cls.assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    Object.assign(assignment, updates);
    this.saveClasses();
  }

  completeAssignment(classId, assignmentId) {
    this.updateAssignment(classId, assignmentId, { completed: true });
  }

  setAssignmentCompletion(classId, assignmentId, completed) {
    this.updateAssignment(classId, assignmentId, { completed: Boolean(completed) });
  }

  removeAssignment(classId, assignmentId) {
    const cls = this.getClass(classId);
    if (!cls) throw new Error('Class not found');

    cls.assignments = cls.assignments.filter(a => a.id !== assignmentId);
    this.saveClasses();
  }

  renderClasses() {
    const container = document.getElementById('classes-list');
    if (!container) return;

    if (this.classes.length === 0) {
      container.innerHTML = '<p class="text-muted">No classes added yet. Create one to get started!</p>';
      return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 1.5rem;">';

    this.classes.forEach(cls => {
      const completedAssignments = cls.assignments.filter(a => a.completed).length;
      const totalAssignments = cls.assignments.length;
      const completionPercent = totalAssignments > 0
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 0;

      html += `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <div>
              <h4 style="margin: 0 0 0.3rem 0;">${cls.name}</h4>
              <p class="text-muted" style="margin: 0; font-size: 0.9rem;">Instructor: ${cls.instructor || 'Not specified'}</p>
            </div>
            <button class="btn btn-secondary btn-small" onclick="classesModule.deleteClass(${cls.id}); classesModule.renderClasses();">Delete</button>
          </div>

          ${totalAssignments > 0 ? `
            <div style="background: #f3f0ff; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem;">
              <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.3rem;">Progress: ${completionPercent}%</div>
              <div style="height: 6px; background: #ede9fe; border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${completionPercent}%; background: #7c3aed; transition: width 0.3s ease;"></div>
              </div>
            </div>
          ` : ''}

          <div style="margin-bottom: 1rem;">
            <div style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem;">Assignments (${completedAssignments}/${totalAssignments})</div>
            ${totalAssignments === 0 ? 
              '<p class="text-muted" style="font-size: 0.9rem;">No assignments yet</p>' :
              `<table style="width: 100%;">
                <tbody>
                  ${cls.assignments.map(assignment => `
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 0.5rem; text-decoration: ${assignment.completed ? 'line-through' : 'none'}; color: ${assignment.completed ? '#999' : '#000'};">
                        ${assignment.name}
                      </td>
                      <td style="padding: 0.5rem; text-align: right; font-size: 0.85rem; color: #999;">
                        ${assignment.dueDate ? assignment.dueDate : 'No date'}
                      </td>
                      <td style="padding: 0.5rem; text-align: right;">
                        <input type="checkbox" ${assignment.completed ? 'checked' : ''} 
                          onchange="classesModule.setAssignmentCompletion(${cls.id}, ${assignment.id}, this.checked); classesModule.renderClasses();"
                          style="cursor: pointer; width: 18px; height: 18px;">
                      </td>
                      <td style="padding: 0.5rem; text-align: right;">
                        <button class="btn btn-secondary btn-small"
                          onclick="classesModule.removeAssignment(${cls.id}, ${assignment.id}); classesModule.renderClasses();">
                          Remove
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>`
            }
          </div>

          <button class="btn btn-secondary" style="width: 100%;" 
            onclick="classesModule.showAddAssignmentModal(${cls.id});">
            + Add Assignment
          </button>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  showAddAssignmentModal(classId) {
    const cls = this.getClass(classId);
    if (!cls) return;

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
    `;

    content.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 0.5rem 0;">Add Assignment to ${cls.name}</h3>
        <p style="color: #999; margin: 0;">Create a new assignment for this class.</p>
      </div>

      <div class="form-group">
        <label>Assignment Name:</label>
        <input type="text" id="modal-assignment-name" placeholder="e.g., Chapter 5 Review">
      </div>

      <div class="form-group">
        <label>Due Date:</label>
        <input type="date" id="modal-assignment-date">
      </div>

      <div style="display: flex; gap: 1rem;">
        <button class="btn btn-secondary" style="flex: 1;" onclick="this.closest('[data-modal]').remove();">Cancel</button>
        <button class="btn btn-primary" style="flex: 1;" onclick="
          const name = document.getElementById('modal-assignment-name').value;
          const date = document.getElementById('modal-assignment-date').value;
          if (!name.trim()) {
            alert('Please enter an assignment name');
            return;
          }
          classesModule.addAssignment(${classId}, name, date);
          classesModule.renderClasses();
          this.closest('[data-modal]').remove();
        ">Add Assignment</button>
      </div>
    `;

    modal.setAttribute('data-modal', 'true');
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Focus on first input
    setTimeout(() => {
      document.getElementById('modal-assignment-name').focus();
    }, 100);
  }

  updateStats() {
    try {
      const stats = storage.get(this.statsKey) || {
        notesCreated: 0,
        grammarChecks: 0,
        flashcards: 0,
        classes: 0
      };

      stats.classes = this.classes.length;
      storage.set(this.statsKey, stats);
      window.dispatchEvent(new CustomEvent('stats-updated', { detail: stats }));
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }
}

// Create global instance
const classesModule = new ClassesModule();
window.classesModule = classesModule;

// Setup event listeners
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupClassesListeners);
} else {
  setupClassesListeners();
}

function setupClassesListeners() {
  const addBtn = document.getElementById('add-class-btn');
  const nameInput = document.getElementById('class-name');
  const instructorInput = document.getElementById('class-instructor');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const instructor = instructorInput.value.trim();

      if (!name) {
        ErrorHandler.showNotification('Please enter a class name', 'error');
        return;
      }

      try {
        classesModule.addClass(name, instructor);
        classesModule.renderClasses();
        nameInput.value = '';
        instructorInput.value = '';
        ErrorHandler.showNotification('Class added!', 'success');
      } catch (error) {
        ErrorHandler.showNotification(error.message, 'error');
      }
    });
  }

  if (nameInput) {
    nameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && addBtn) {
        addBtn.click();
      }
    });
  }

  // Initial render
  classesModule.renderClasses();
}
