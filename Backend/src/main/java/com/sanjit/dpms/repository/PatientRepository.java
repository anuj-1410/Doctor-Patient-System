package com.sanjit.dpms.repository;

import com.sanjit.dpms.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
}
