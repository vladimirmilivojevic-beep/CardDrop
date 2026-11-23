package com.carddrop.app.ui

import android.content.Intent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.carddrop.app.data.Contact
import com.carddrop.app.vcard.VCardManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyCardScreen(onNavigateToScanner: () -> Unit) {
    val context = LocalContext.current
    var isCompact by remember { mutableStateOf(false) }

    // Sample active card (in production loaded from DataStore / Room)
    val myCard = remember {
        Contact(
            id = "my_primary_card",
            firstName = "Alex",
            lastName = "Rivera",
            formattedName = "Alex Rivera",
            organization = "Nova Mobile Labs",
            title = "Senior Mobile Engineer",
            phoneMobile = "+1 (555) 234-5678",
            emailWork = "alex.rivera@novamobile.dev",
            addressFormatted = "400 Congress Ave, Austin, TX 78701",
            websiteUrl = "https://novamobile.dev",
            note = "Passionate about Kotlin, Jetpack Compose, and offline-first Android apps."
        )
    }

    val vcardString = remember(myCard, isCompact) {
        VCardManager.generateVCard3(myCard, compact = isCompact)
    }

    val qrBitmap = remember(vcardString) {
        VCardManager.generateQRCodeBitmap(vcardString, 600, 600)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My QR Card", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = onNavigateToScanner) {
                        Icon(Icons.Default.CameraAlt, contentDescription = "Scan QR")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // High-Contrast QR Card surface
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(28.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                modifier = Modifier.padding(top = 10.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Image(
                        bitmap = qrBitmap.asImageBitmap(),
                        contentDescription = "Contact QR Code",
                        modifier = Modifier
                            .size(260.dp)
                            .clip(RoundedCornerShape(12.dp))
                    )

                    Spacer(modifier = Modifier.height(12.dp))
                    Surface(
                        color = Color(0xFFF1F5F9),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = "Scan with any phone camera",
                            color = Color(0xFF475569),
                            style = MaterialTheme.typography.labelSmall,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            // Name & Organization Header
            Text(
                text = myCard.formattedName,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "${myCard.title} • ${myCard.organization}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Action Buttons Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = {
                        val sendIntent = Intent().apply {
                            action = Intent.ACTION_SEND
                            putExtra(Intent.EXTRA_TEXT, vcardString)
                            type = "text/x-vcard"
                        }
                        context.startActivity(Intent.createChooser(sendIntent, "Share Contact VCF"))
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Share VCF")
                }

                OutlinedButton(
                    onClick = { isCompact = !isCompact },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(
                        if (isCompact) Icons.Default.FlashOn else Icons.Default.FlashOff,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (isCompact) "Fast Scan On" else "Fast Scan")
                }
            }
        }
    }
}
