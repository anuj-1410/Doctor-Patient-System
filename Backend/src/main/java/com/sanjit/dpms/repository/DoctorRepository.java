package com.sanjit.dpms.repository;

import com.sanjit.dpms.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
}
