package com.carddrop.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "contacts")
data class Contact(
    @PrimaryKey val id: String,
    val firstName: String = "",
    val lastName: String = "",
    val formattedName: String = "",
    val organization: String = "",
    val title: String = "",
    val department: String = "",
    val phoneMobile: String = "",
    val phoneWork: String = "",
    val emailWork: String = "",
    val emailPersonal: String = "",
    val addressFormatted: String = "",
    val websiteUrl: String = "",
    val note: String = "",
    val category: String = "Work", // Work, Personal, Networking, Client
    val isFavorite: Boolean = false,
    val source: String = "manual", // scanned, imported, manual
    val rawVcard: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
